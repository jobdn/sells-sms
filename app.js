const express = require("express");
// const nodemailer = require("nodemailer");
const { PrismaClient } = require("@prisma/client");
const app = express();
const axiosHttp = require("axios");
var cors = require("cors");

require("dotenv").config();
const PORT = 3010;
const { normalizeRuPhone } = require("./utils");

// Инициализация Prisma Client
const prisma = new PrismaClient();

// Middleware для парсинга JSON
app.use(express.json());
app.use(cors());

// app.use(
//   cors({
//     origin: [
//       "https://project15629466.tilda.ws",
//       "https://project15629466.tilda.ws/", // можно не надо, но иногда путают
//       "http://localhost:3000",
//       "http://localhost:5173",
//     ],
//     methods: ["GET", "POST", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     // credentials: true, // включай только если реально используешь cookies/сессии
//   })
// );

// Email получателя (можно вынести в переменные окружения)
// const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL || "recipient@example.com";

// Настройка транспорта для отправки email
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST || "smtp.gmail.com",
//   port: process.env.SMTP_PORT || 587,
//   secure: false, // true для 465, false для других портов
//   auth: {
//     user: process.env.SMTP_USER, // email отправителя
//     pass: process.env.SMTP_PASS, // пароль отправителя
//   },
// });

// Функция для генерации 6-значного кода
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const SENDER_NAME = process.env.SENDER_NAME;
const API_KEY = process.env.PROSTO_SMS_API_KEY;
const LOGIN = process.env.LOGIN;
const PASSWORD = process.env.PASSWORD;

// Функция для отправки SMS (заглушка - здесь можно интегрировать Twilio, SMS.ru и т.д.)
async function sendSMSCode(phone, code) {
  const smsText = `Код подтверждения: ${code}`;

  // const response = await axiosHttp.post(
  //   `https://ssl.bs00.ru/?method=push_msg&key=${API_KEY}&text=${smsText}&phone=${phone}&sender_name=${SENDER_NAME}&priority=1&format=json`
  // );

  // const response = await axiosHttp.post(
  //   `https://ssl.bs00.ru/?method=push_msg&email=${LOGIN}&password=${PASSWORD}&text=${smsText}&phone=${phone}&sender_name=${SENDER_NAME}&priority=1&format=json`
  // );

  // const responseData = response.data.response;

  // console.log("response", responseData);

  // if (+responseData?.msg?.err_code) {
  //   throw new Error(responseData?.msg?.text);
  // }
}

// Функция для отправки email с контактами пользователя
// async function sendUserContacts(fullname, phone, city) {
//   try {
//     const mailOptions = {
//       from: process.env.SMTP_USER || "noreply@example.com",
//       to: RECIPIENT_EMAIL,
//       subject: "Новые контакты пользователя",
//       html: `
//         <h2>Новые контакты пользователя</h2>
//         <p><strong>ФИО:</strong> ${fullname}</p>
//         <p><strong>Телефон:</strong> ${phone}</p>
//         <p><strong>Город:</strong> ${city}</p>
//       `,
//     };

//     const info = await transporter.sendMail(mailOptions);
//     console.log("Email отправлен:", info.messageId);
//     return true;
//   } catch (error) {
//     console.error("Ошибка при отправке email:", error);
//     throw error;
//   }
// }

app.post("/", async (req, res) => {
  console.log("data received", req.body);
  try {
    const { fullname, phone, city } = req.body;
    const normalizedPhone = normalizeRuPhone(phone);

    if (!normalizedPhone) {
      return res.status(400).json({
        error: "Некорректный номер телефона",
      });
    }

    // Валидация обязательных полей
    if (!fullname || !city) {
      return res.status(400).json({
        error: "Необходимо указать все поля: fullname, city",
      });
    }
    // Генерация 6-значного кода
    const code = generateCode();

    await sendSMSCode(normalizedPhone, code);

    // Сохранение кода и данных пользователя в БД
    // Используем upsert для обновления существующей записи или создания новой
    await prisma.userCode.upsert({
      where: { phone: normalizedPhone },
      update: {
        code,
        fullname,
        city,
      },
      create: {
        phone: normalizedPhone,
        code,
        fullname,
        city,
      },
    });
    // Отправка кода на телефон

    return res.status(200).send({ message: "OK" });
  } catch (error) {
    if (error.response) {
      console.error("Ошибка при отправке: ", error.response.data);
      res
        .status(500)
        .send(
          `Не удалось отправить пароль: ${error.response.data.error.message}`
        );
    } else {
      console.error("Ошибка: ", error.message);
      res.status(500).send(`Не удалось отправить пароль: ${error.message}`);
    }
  }
  return res.status(200).send({ message: "OK" });
});

app.post("/verify", async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const normalizedPhone = normalizeRuPhone(phone);

    console.log("normalizedPhone", normalizedPhone, phone, otp);

    if (!normalizedPhone) {
      return res.status(400).json({
        error: "Некорректный номер телефона",
      });
    }

    // Валидация обязательных полей
    if (!otp) {
      return res.status(400).json({
        error: "Необходимо указать otp",
      });
    }

    // Поиск данных пользователя в БД
    const userData = await prisma.userCode.findUnique({
      where: { phone: normalizedPhone },
    });

    if (!userData) {
      return res.status(404).json({
        error:
          "Код не найден. Возможно, истек срок действия или телефон неверен.",
      });
    }

    // Проверка, не был ли код уже использован
    if (userData.verified) {
      return res.status(400).json({
        error: "Код уже был использован",
      });
    }

    // Проверка совпадения кода
    if (userData.code !== otp) {
      return res.status(400).json({
        error: "Неверный код",
      });
    }

    // Код совпал - отправляем контакты на почту

    // Помечаем код как использованный
    await prisma.userCode.update({
      where: { phone: normalizedPhone },
      data: { verified: true },
    });

    // await sendUserContacts(userData.fullname, userData.phone, userData.city);

    res.json({
      success: true,
      message: "Код подтвержден. Контакты отправлены на почту.",
    });
  } catch (error) {
    console.error("Ошибка при проверке кода:", error);
    res.status(500).json({
      error: "Внутренняя ошибка сервера",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
