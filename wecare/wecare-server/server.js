const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'chave_secreta_padrao', (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token inválido" });
    }
    req.user = user;
    next();
  });
};

async function initializeDatabase() {
  let connection;
  try {
    console.log("Inicializando banco de dados...");

    const initialPool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    connection = await initialPool.getConnection();
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`
    );
    connection.release();

    const dbConnection = await pool.getConnection();

    console.log("Criando tabelas...");
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        senha VARCHAR(255) NOT NULL,
        telefone VARCHAR(20),
        cpf VARCHAR(14),
        tipo_usuario ENUM('paciente', 'profissional') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_email (email),
        UNIQUE KEY unique_cpf (cpf)
      )
    `);

    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS consultas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        paciente_id INT NOT NULL,
        profissional_id INT NOT NULL,
        data VARCHAR(10) NOT NULL,
        horario VARCHAR(5) NOT NULL,
        status ENUM('agendado', 'confirmado', 'concluído', 'cancelado') DEFAULT 'agendado',
        online BOOLEAN DEFAULT false,
        valor DECIMAL(10,2),
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (paciente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (profissional_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);

    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS horarios_disponiveis (
        id INT PRIMARY KEY AUTO_INCREMENT,
        profissional_id INT NOT NULL,
        data DATE NOT NULL,
        horario_inicio TIME NOT NULL,
        horario_fim TIME NOT NULL,
        valor DECIMAL(10,2),
        online TINYINT(1) DEFAULT 0,
        disponivel TINYINT(1) DEFAULT 1,
        endereco VARCHAR(255),
        observacoes TEXT,
        INDEX (profissional_id),
        INDEX (data),
        INDEX (disponivel),
        FOREIGN KEY (profissional_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);

    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS pacientes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        data_nascimento VARCHAR(10),
        genero VARCHAR(20),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);

    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS profissionais_saude (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        area_atuacao VARCHAR(100) NOT NULL,
        crm VARCHAR(20),
        data_nascimento VARCHAR(10),
        genero VARCHAR(20),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);

    console.log("Banco de dados e tabelas inicializados com sucesso!");
    dbConnection.release();
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error);
  }
}

initializeDatabase();

app.all("/setup", async (req, res) => {
  try {
    console.log("Inicializando tabelas via endpoint...");
    const connection = await pool.getConnection();

    await connection.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        senha VARCHAR(255) NOT NULL,
        telefone VARCHAR(20),
        cpf VARCHAR(14),
        tipo_usuario ENUM('paciente', 'profissional') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_email (email),
        UNIQUE KEY unique_cpf (cpf)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS pacientes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        data_nascimento VARCHAR(10),
        genero VARCHAR(20),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS profissionais_saude (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        area_atuacao VARCHAR(100) NOT NULL,
        crm VARCHAR(20),
        data_nascimento VARCHAR(10),
        genero VARCHAR(20),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);

    connection.release();
    res.send("Tabelas criadas com sucesso!");
  } catch (error) {
    console.error("Erro ao criar tabelas:", error);
    res.status(500).send("Erro ao configurar banco de dados");
  }
});

app.post("/verificar-cadastro", async (req, res) => {
  try {
    const { email, cpf } = req.body;
    const connection = await pool.getConnection();

    const [emailResults] = await connection.query(
      "SELECT id FROM usuarios WHERE email = ?",
      [email]
    );

    const [cpfResults] = await connection.query(
      "SELECT id FROM usuarios WHERE cpf = ?",
      [cpf]
    );

    connection.release();

    res.json({
      emailExists: emailResults.length > 0,
      cpfExists: cpfResults.length > 0,
    });
  } catch (error) {
    console.error("Erro ao verificar cadastro:", error);
    res.status(500).json({ error: "Erro ao verificar cadastro" });
  }
});

app.post("/usuarios", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [emailCheck] = await connection.query(
      "SELECT id FROM usuarios WHERE email = ?",
      [req.body.email]
    );

    if (emailCheck.length > 0) {
      return res.status(400).json({ error: "Este email já está cadastrado" });
    }

    const [cpfCheck] = await connection.query(
      "SELECT id FROM usuarios WHERE cpf = ?",
      [req.body.cpf]
    );

    if (cpfCheck.length > 0) {
      return res.status(400).json({ error: "Este CPF já está cadastrado" });
    }

    await connection.beginTransaction();

    const {
      name,
      email,
      password,
      phone,
      cpf,
      userType,
      area,
      crm,
      dob,
      gender,
    } = req.body;

    const [userResult] = await connection.query(
      `INSERT INTO usuarios 
       (nome, email, senha, telefone, cpf, tipo_usuario) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, password, phone, cpf, userType]
    );

    const userId = userResult.insertId;

    if (userType === "paciente") {
      await connection.query(
        `INSERT INTO pacientes (usuario_id, data_nascimento, genero)
         VALUES (?, ?, ?)`,
        [userId, dob, gender]
      );
    } else if (userType === "profissional") {
      await connection.query(
        `INSERT INTO profissionais_saude (usuario_id, area_atuacao, crm, data_nascimento, genero)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, area, crm, dob, gender]
      );
    }

    await connection.commit();

    res.status(201).json({
      id: userId,
      nome: name,
      email: email,
      tipo: userType,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao cadastrar:", error);

    if (error.code === "ER_DUP_ENTRY") {
      if (error.sqlMessage.includes("unique_email")) {
        return res.status(400).json({ error: "Este email já está cadastrado" });
      } else if (error.sqlMessage.includes("unique_cpf")) {
        return res.status(400).json({ error: "Este CPF já está cadastrado" });
      }
    }

    res.status(500).json({ error: "Erro ao cadastrar usuário" });
  } finally {
    connection.release();
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    const user = users[0];

    if (password !== user.senha) {
      return res.status(401).json({ error: "Senha incorreta" });
    }

    let additionalInfo = {};

    if (user.tipo_usuario === "paciente") {
      const [pacientes] = await pool.query(
        "SELECT * FROM pacientes WHERE usuario_id = ?",
        [user.id]
      );

      if (pacientes.length > 0) {
        additionalInfo = {
          data_nascimento: pacientes[0].data_nascimento,
          genero: pacientes[0].genero,
        };
      }
    } else if (user.tipo_usuario === "profissional") {
      const [profissionais] = await pool.query(
        "SELECT * FROM profissionais_saude WHERE usuario_id = ?",
        [user.id]
      );

      if (profissionais.length > 0) {
        additionalInfo = {
          area_atuacao: profissionais[0].area_atuacao,
          crm: profissionais[0].crm,
          data_nascimento: profissionais[0].data_nascimento,
          genero: profissionais[0].genero,
        };
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, tipo: user.tipo_usuario },
      process.env.JWT_SECRET || "chave_secreta_padrao",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: user.tipo_usuario,
        ...additionalInfo,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: "Erro no servidor" });
  }
});

app.get("/teste-conexao", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    res.json({
      message: "Conexão com o banco de dados estabelecida com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao conectar ao banco de dados:", error);
    res.status(500).json({ error: "Erro ao conectar ao banco de dados" });
  }
});

app.get("/consultas/paciente/:id", authenticateToken, async (req, res) => {
  try {
    const pacienteId = req.params.id;
    const connection = await pool.getConnection();
    
    const [consultas] = await connection.query(`
      SELECT c.*, 
             u.nome as profissional_nome,
             ps.area_atuacao as especialidade
      FROM consultas c
      JOIN usuarios u ON c.profissional_id = u.id
      JOIN profissionais_saude ps ON u.id = ps.usuario_id
      WHERE c.paciente_id = ?
      ORDER BY c.data ASC, c.horario ASC
    `, [pacienteId]);
    
    connection.release();
    res.json(consultas);
  } catch (error) {
    console.error("Erro ao buscar consultas:", error);
    res.status(500).json({ error: "Erro ao buscar consultas" });
  }
});

app.post("/consultas", authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { 
      paciente_id, 
      profissional_id, 
      data, 
      horario, 
      valor, 
      online,
      horario_id
    } = req.body;
    
    console.log("Recebida solicitação de agendamento:", req.body);
    
    let horarioQuery;
    let horarioParams;
    
    if (horario_id) {
      horarioQuery = `
        SELECT id FROM horarios_disponiveis 
        WHERE id = ? AND disponivel = 1
      `;
      horarioParams = [horario_id];
    } else {
      horarioQuery = `
        SELECT id FROM horarios_disponiveis 
        WHERE profissional_id = ? AND data = ? AND horario_inicio = ? AND disponivel = 1
      `;
      horarioParams = [profissional_id, data, horario];
    }
    
    const [horarioDisponivel] = await connection.query(horarioQuery, horarioParams);
    
    if (horarioDisponivel.length === 0) {
      connection.release();
      return res.status(400).json({ error: "Horário não disponível ou já foi reservado" });
    }
    
    const horarioId = horarioDisponivel[0].id;
    
    await connection.beginTransaction();
    
    const [result] = await connection.query(`
      INSERT INTO consultas 
      (paciente_id, profissional_id, data, horario, status, online, valor) 
      VALUES (?, ?, ?, ?, 'agendado', ?, ?)
    `, [paciente_id, profissional_id, data, horario, online, valor]);
    
    await connection.query(`
      UPDATE horarios_disponiveis 
      SET disponivel = 0 
      WHERE id = ?
    `, [horarioId]);
    
    await connection.commit();
    
    console.log(`Consulta agendada com sucesso. ID: ${result.insertId}`);
    
    res.status(201).json({
      id: result.insertId,
      mensagem: "Consulta agendada com sucesso"
    });
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao agendar consulta:", error);
    res.status(500).json({ error: "Erro ao agendar consulta", details: error.message });
  } finally {
    connection.release();
  }
});

app.get("/consultas/verificar-agendamento", authenticateToken, async (req, res) => {
  try {
    const { profissional_id, data, horario } = req.query;
    
    if (!profissional_id || !data || !horario) {
      return res.status(400).json({ error: "Parâmetros incompletos" });
    }
    
    const connection = await pool.getConnection();
    
    const [consultas] = await connection.query(`
      SELECT id FROM consultas
      WHERE profissional_id = ? AND data = ? AND horario = ?
    `, [profissional_id, data, horario]);
    
    connection.release();
    
    res.json({ 
      disponivel: consultas.length === 0,
      consulta_id: consultas.length > 0 ? consultas[0].id : null
    });
  } catch (error) {
    console.error("Erro ao verificar disponibilidade:", error);
    res.status(500).json({ error: "Erro ao verificar disponibilidade" });
  }
});

app.get("/horarios-disponiveis/profissional/:id", async (req, res) => {
  try {
    const profissionalId = req.params.id;
    console.log(`Buscando horários disponíveis para profissional ID: ${profissionalId}`);
    
    const connection = await pool.getConnection();
    
    const [profissionais] = await connection.query(
      "SELECT id FROM usuarios WHERE id = ? AND tipo_usuario = 'profissional'", 
      [profissionalId]
    );
    
    if (profissionais.length === 0) {
      connection.release();
      return res.status(404).json({ error: "Profissional não encontrado" });
    }
    
    const [horarios] = await connection.query(`
      SELECT 
        id,
        DATE_FORMAT(data, '%Y-%m-%d') as data,
        horario_inicio,
        horario_fim,
        valor,
        online,
        disponivel,
        endereco,
        observacoes
      FROM horarios_disponiveis 
      WHERE profissional_id = ? AND disponivel = 1 AND data >= CURDATE()
      ORDER BY data ASC, horario_inicio ASC
    `, [profissionalId]);
    
    console.log(`Encontrados ${horarios.length} horários disponíveis`);
    
    const horariosAgrupados = {};
    
    horarios.forEach(horario => {
      horario.valor = parseFloat(horario.valor || 0);
      
      horario.online = horario.online === 1;
      
      if (!horariosAgrupados[horario.data]) {
        horariosAgrupados[horario.data] = [];
      }
      
      horariosAgrupados[horario.data].push(horario);
    });
    
    connection.release();
    res.json(horariosAgrupados);
  } catch (error) {
    console.error("Erro detalhado ao buscar horários disponíveis:", error);
    res.status(500).json({ 
      error: "Erro ao buscar horários disponíveis", 
      details: error.message 
    });
  }
});

app.put("/consultas/:id/cancelar", authenticateToken, async (req, res) => {
  try {
    const consultaId = req.params.id;
    const connection = await pool.getConnection();
    
    const [result] = await connection.query(`
      UPDATE consultas SET status = 'cancelado' WHERE id = ?
    `, [consultaId]);
    
    connection.release();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Consulta não encontrada" });
    }
    
    res.json({ mensagem: "Consulta cancelada com sucesso" });
  } catch (error) {
    console.error("Erro ao cancelar consulta:", error);
    res.status(500).json({ error: "Erro ao cancelar consulta" });
  }
});

app.post("/horarios-disponiveis", authenticateToken, async (req, res) => {
  try {
    const { 
      profissional_id, 
      data, 
      horario_inicio, 
      horario_fim, 
      intervalo, 
      valor, 
      online,
      endereco,
      observacoes
    } = req.body;
    
    const connection = await pool.getConnection();
    
    const [inicio_hora, inicio_min] = horario_inicio.split(':').map(Number);
    const [fim_hora, fim_min] = horario_fim.split(':').map(Number);
    
    let inicio_total_min = inicio_hora * 60 + inicio_min;
    const fim_total_min = fim_hora * 60 + fim_min;
    
    await connection.beginTransaction();
    
    while (inicio_total_min < fim_total_min) {
      const atual_hora = Math.floor(inicio_total_min / 60);
      const atual_min = inicio_total_min % 60;
      
      const horario_atual = `${atual_hora.toString().padStart(2, '0')}:${atual_min.toString().padStart(2, '0')}`;
      
      await connection.query(`
        INSERT INTO horarios_disponiveis 
        (profissional_id, data, horario_inicio, horario_fim, valor, online, endereco, observacoes) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        profissional_id, 
        data, 
        horario_atual, 
        `${Math.floor((inicio_total_min + intervalo) / 60).toString().padStart(2, '0')}:${((inicio_total_min + intervalo) % 60).toString().padStart(2, '0')}`,
        valor,
        online,
        endereco,
        observacoes
      ]);
      
      inicio_total_min += intervalo;
    }
    
    await connection.commit();
    connection.release();
    
    res.status(201).json({
      mensagem: "Horários cadastrados com sucesso"
    });
  } catch (error) {
    console.error("Erro ao cadastrar horários:", error);
    res.status(500).json({ error: "Erro ao cadastrar horários" });
  }
});

app.get("/consultas/profissional/:id", authenticateToken, async (req, res) => {
  try {
    const profissionalId = req.params.id;
    const connection = await pool.getConnection();
    
    const [consultas] = await connection.query(`
      SELECT c.*,
             u.nome as paciente_nome,
             u.telefone as paciente_telefone,
             p.data_nascimento, 
             p.genero
      FROM consultas c
      JOIN usuarios u ON c.paciente_id = u.id
      JOIN pacientes p ON u.id = p.usuario_id
      WHERE c.profissional_id = ?
      ORDER BY c.data ASC, c.horario ASC
    `, [profissionalId]);
    
    const hoje = new Date();
    consultas.forEach(consulta => {
      if (consulta.data_nascimento) {
        const nascimento = new Date(consulta.data_nascimento);
        consulta.paciente_idade = hoje.getFullYear() - nascimento.getFullYear();
        if (hoje.getMonth() < nascimento.getMonth() || 
           (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate())) {
          consulta.paciente_idade--;
        }
      } else {
        consulta.paciente_idade = null;
      }
    });
    
    connection.release();
    res.json(consultas);
  } catch (error) {
    console.error("Erro ao buscar consultas do profissional:", error);
    res.status(500).json({ error: "Erro ao buscar consultas do profissional" });
  }
});

app.put("/consultas/:id/status", authenticateToken, async (req, res) => {
  try {
    const consultaId = req.params.id;
    const { status } = req.body;
    
    if (!['confirmado', 'cancelado', 'concluído'].includes(status)) {
      return res.status(400).json({ error: "Status inválido" });
    }
    
    const connection = await pool.getConnection();
    
    const [consultas] = await connection.query(`
      SELECT * FROM consultas WHERE id = ?
    `, [consultaId]);
    
    if (consultas.length === 0) {
      connection.release();
      return res.status(404).json({ error: "Consulta não encontrada" });
    }
    
    if (consultas[0].profissional_id !== req.user.id && req.user.tipo !== 'admin') {
      connection.release();
      return res.status(403).json({ error: "Sem permissão para alterar esta consulta" });
    }
    
    await connection.query(`
      UPDATE consultas SET status = ? WHERE id = ?
    `, [status, consultaId]);
    
    connection.release();
    res.json({ mensagem: `Consulta ${status} com sucesso` });
  } catch (error) {
    console.error("Erro ao atualizar status da consulta:", error);
    res.status(500).json({ error: "Erro ao atualizar status da consulta" });
  }
});

app.get("/api-test", (req, res) => {
  res.json({ message: "API está funcionando!" });
});



app.get("/profissionais", async (req, res) => {
  console.log("Endpoint /profissionais foi chamado!");
  try {
    const connection = await pool.getConnection();
    
    const [profissionais] = await connection.query(`
      SELECT 
        u.id,
        u.nome,
        u.telefone,
        ps.area_atuacao,
        ps.crm,
        ps.data_nascimento
      FROM usuarios u
      JOIN profissionais_saude ps ON u.id = ps.usuario_id
      WHERE u.tipo_usuario = 'profissional'
    `);
    
    console.log(`Encontrados ${profissionais.length} profissionais`);
    
    connection.release();
    res.status(200).json(profissionais);
  } catch (error) {
    console.error("Erro detalhado ao buscar profissionais:", error);
    res.status(500).json({ error: "Erro ao buscar profissionais", details: error.message });
  }
});


app.get("/profissionais/:id", async (req, res) => {
  try {
    const profissionalId = req.params.id;
    console.log(`Buscando detalhes do profissional ID: ${profissionalId}`);
    
    const connection = await pool.getConnection();
    
    const [profissionais] = await connection.query(`
      SELECT 
        u.id,
        u.nome,
        u.email,
        u.telefone,
        ps.area_atuacao,
        ps.crm,
        ps.data_nascimento,
        ps.genero
      FROM usuarios u
      JOIN profissionais_saude ps ON u.id = ps.usuario_id
      WHERE u.id = ? AND u.tipo_usuario = 'profissional'
    `, [profissionalId]);
    
    if (profissionais.length === 0) {
      console.log(`Profissional com ID ${profissionalId} não encontrado`);
      connection.release();
      return res.status(404).json({ error: "Profissional não encontrado" });
    }
    
    const profissional = {
      ...profissionais[0],
      total_horarios_disponiveis: 0,
      total_consultas_realizadas: 0
    };
    
    try {
      const [horariosDisponiveis] = await connection.query(`
        SELECT COUNT(*) as total_horarios 
        FROM horarios_disponiveis 
        WHERE profissional_id = ? AND data >= CURDATE() AND disponivel = 1
      `, [profissionalId]);
      
      profissional.total_horarios_disponiveis = horariosDisponiveis[0]?.total_horarios || 0;
    } catch (statError) {
      console.error("Erro ao buscar horários disponíveis:", statError);
    }
    
    try {
      const [consultasRealizadas] = await connection.query(`
        SELECT COUNT(*) as total_consultas
        FROM consultas
        WHERE profissional_id = ? AND status = 'concluído'
      `, [profissionalId]);
      
      profissional.total_consultas_realizadas = consultasRealizadas[0]?.total_consultas || 0;
    } catch (statError) {
      console.error("Erro ao buscar consultas realizadas:", statError);
    }
    
    if (profissional.data_nascimento) {
      try {
        const nascimento = new Date(profissional.data_nascimento);
        const hoje = new Date();
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        if (hoje.getMonth() < nascimento.getMonth() || 
           (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate())) {
          idade--;
        }
        profissional.idade = idade;
      } catch (dateError) {
        console.error("Erro ao calcular idade:", dateError);
        profissional.idade = null;
      }
    }
    
    connection.release();
    res.json(profissional);
  } catch (error) {
    console.error("Erro detalhado ao buscar profissional:", error);
    res.status(500).json({ 
      error: "Erro ao buscar detalhes do profissional",
      details: error.message 
    });
  }
});

app.get("/horarios-disponiveis/profissional/:id", async (req, res) => {
  try {
    const profissionalId = req.params.id;
    console.log(`Buscando horários disponíveis para profissional ID: ${profissionalId}`);
    
    const connection = await pool.getConnection();
    
    const [horarios] = await connection.query(`
      SELECT 
        id,
        data,
        horario_inicio,
        horario_fim,
        IFNULL(valor, 0) as valor,
        online,
        disponivel,
        endereco,
        observacoes
      FROM horarios_disponiveis 
      WHERE profissional_id = ? AND disponivel = 1 AND data >= CURDATE()
      ORDER BY data ASC, horario_inicio ASC
    `, [profissionalId]);
    
    console.log(`Encontrados ${horarios.length} horários disponíveis`);
    
    const horariosAgrupados = {};
    
    horarios.forEach(horario => {
      try {
        horario.valor = parseFloat(horario.valor || 0);
        
        let dataFormatada;
        
        if (horario.data instanceof Date) {
          dataFormatada = horario.data.toISOString().split('T')[0];
        } else if (typeof horario.data === 'string') {
          dataFormatada = horario.data;
        } else {
          dataFormatada = new Date(horario.data).toISOString().split('T')[0];
        }
        
        if (!horariosAgrupados[dataFormatada]) {
          horariosAgrupados[dataFormatada] = [];
        }
        horariosAgrupados[dataFormatada].push({
          ...horario,
          online: horario.online === 1 || horario.online === true
        });
      } catch (itemError) {
        console.error("Erro ao processar horário:", itemError, horario);
      }
    });
    
    connection.release();
    res.json(horariosAgrupados);
  } catch (error) {
    console.error("Erro detalhado ao buscar horários disponíveis:", error);
    res.status(500).json({ 
      error: "Erro ao buscar horários disponíveis", 
      details: error.message 
    });
  }
});



app.get("/profissionais/:id/estatisticas", authenticateToken, async (req, res) => {
  try {
    const profissionalId = req.params.id;
    
    if (req.user.id != profissionalId && req.user.tipo !== 'admin') {
      return res.status(403).json({ error: "Sem permissão para acessar estes dados" });
    }
    
    const connection = await pool.getConnection();
    const hoje = new Date().toISOString().split('T')[0];
    
    const [consultasHoje] = await connection.query(`
      SELECT COUNT(*) as total FROM consultas 
      WHERE profissional_id = ? AND data = ?
    `, [profissionalId, hoje]);
    
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - dataInicio.getDay()); 
    const dataFim = new Date(dataInicio);
    dataFim.setDate(dataInicio.getDate() + 6); 
    
    const [consultasSemana] = await connection.query(`
      SELECT COUNT(*) as total FROM consultas 
      WHERE profissional_id = ? 
      AND data >= ? AND data <= ?
    `, [
      profissionalId, 
      dataInicio.toISOString().split('T')[0], 
      dataFim.toISOString().split('T')[0]
    ]);
    
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    
    const [novosAgendamentos] = await connection.query(`
      SELECT COUNT(*) as total FROM consultas 
      WHERE profissional_id = ? 
      AND created_at >= ?
    `, [profissionalId, ontem.toISOString().split('.')[0]]);
    
    connection.release();
    
    res.json({
      consultasHoje: consultasHoje[0].total,
      consultasSemana: consultasSemana[0].total,
      novosAgendamentos: novosAgendamentos[0].total
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});