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

    // Agora usando o banco wecare_db
    const dbConnection = await pool.getConnection();

    // Criar tabelas
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
