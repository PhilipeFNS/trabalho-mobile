const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuração do BD
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Função para inicializar o banco de dados e tabelas automaticamente
async function initializeDatabase() {
  let connection;
  try {
    console.log("Inicializando banco de dados...");

    // Conexão inicial sem banco específico
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

    // Agora usando o banco wecare_db
    const dbConnection = await pool.getConnection();

    // Criar tabelas
    console.log("Criando tabelas...");
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        telefone VARCHAR(20),
        cpf VARCHAR(14) UNIQUE,
        tipo_usuario ENUM('paciente', 'profissional') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS pacientes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        data_nascimento VARCHAR(10),
        idade INT,
        genero VARCHAR(20),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);

    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS profissionais_saude (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        area_atuacao VARCHAR(100) NOT NULL,
        data_nascimento VARCHAR(10),
        idade INT,
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

// Inicializa o banco e tabelas ao iniciar o servidor
initializeDatabase();

// Inicializar tabelas via endpoint
app.all("/setup", async (req, res) => {
  try {
    console.log("Inicializando tabelas via endpoint...");
    const connection = await pool.getConnection();

    // Tabela de usuários
    await connection.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        telefone VARCHAR(20),
        cpf VARCHAR(14) UNIQUE,
        tipo_usuario ENUM('paciente', 'profissional') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela específica para pacientes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pacientes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        data_nascimento VARCHAR(10),
        idade INT,
        genero VARCHAR(20),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);

    // Tabela específica para profissionais de saúde
    await connection.query(`
      CREATE TABLE IF NOT EXISTS profissionais_saude (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        area_atuacao VARCHAR(100) NOT NULL,
        data_nascimento VARCHAR(10),
        idade INT,
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

// Cadastro de usuário
app.post("/usuarios", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      name,
      email,
      password, // Senha sem hash
      phone,
      cpf,
      userType,
      area,
      dob, // Data sem conversão
      age,
      gender,
    } = req.body;

    // Inserir na tabela de usuários (sem hash de senha)
    const [userResult] = await connection.query(
      `INSERT INTO usuarios 
       (nome, email, senha, telefone, cpf, tipo_usuario) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, password, phone, cpf, userType]
    );

    const userId = userResult.insertId;

    // Baseado no tipo de usuário, inserir na tabela correspondente
    if (userType === "paciente") {
      await connection.query(
        `INSERT INTO pacientes (usuario_id, data_nascimento, idade, genero)
         VALUES (?, ?, ?, ?)`,
        [userId, dob, age, gender]
      );
    } else if (userType === "profissional") {
      await connection.query(
        `INSERT INTO profissionais_saude (usuario_id, area_atuacao, data_nascimento, idade, genero)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, area, dob, age, gender]
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
      if (error.sqlMessage.includes("email")) {
        return res.status(400).json({ error: "Este email já está cadastrado" });
      } else if (error.sqlMessage.includes("cpf")) {
        return res.status(400).json({ error: "Este CPF já está cadastrado" });
      }
    }

    res.status(500).json({ error: "Erro ao cadastrar usuário" });
  } finally {
    connection.release();
  }
});

// Login (simplificado, sem verificação de hash)
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Buscar o usuário pelo email
    const [users] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [
      username,
    ]);

    if (users.length === 0) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    const user = users[0];

    // Verificação simples de senha (sem bcrypt)
    if (password !== user.senha) {
      return res.status(401).json({ error: "Senha incorreta" });
    }

    // Buscar informações adicionais baseado no tipo de usuário
    let additionalInfo = {};

    if (user.tipo_usuario === "paciente") {
      const [pacientes] = await pool.query(
        "SELECT * FROM pacientes WHERE usuario_id = ?",
        [user.id]
      );

      if (pacientes.length > 0) {
        additionalInfo = {
          data_nascimento: pacientes[0].data_nascimento,
          idade: pacientes[0].idade,
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
          data_nascimento: profissionais[0].data_nascimento,
          idade: profissionais[0].idade,
          genero: profissionais[0].genero,
        };
      }
    }

    // Token simplificado
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

// Rota de teste para verificar conexão
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

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
