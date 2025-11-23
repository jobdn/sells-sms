const express = require("express");
const nodemailer = require("nodemailer");
const { PrismaClient } = require("@prisma/client");
const app = express();
const PORT = 3010;

// Инициализация Prisma Client
// const prisma = new PrismaClient();

// Middleware для парсинга JSON
app.use(express.json());

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

// Функция для отправки SMS (заглушка - здесь можно интегрировать Twilio, SMS.ru и т.д.)
async function sendSMSCode(phone, code) {
  // TODO: Интегрировать реальный сервис отправки SMS
  // Например: Twilio, SMS.ru, AWS SNS и т.д.
  console.log(`Отправка SMS на ${phone} с кодом: ${code}`);

  const response = await fetch("https://new.smsgorod.ru/apiSms/create", {
    method: "POST",
    body: JSON.stringify({
      apiKey: process.env.API_KEY,
      sms: [{ text: code, phone: phone }],
    }),
  }).then((res) => res.json());

  console.log(response.body);

  // В реальном приложении здесь будет вызов API сервиса отправки SMS
  return true;
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
  try {
    const { fullname, phone, city } = req.body;

    // Валидация обязательных полей
    if (!fullname || !phone || !city) {
      return res.status(400).json({
        error: "Необходимо указать все поля: fullname, phone, city",
      });
    }

    // Генерация 6-значного кода
    const code = generateCode();

    // Сохранение кода и данных пользователя в БД
    // Используем upsert для обновления существующей записи или создания новой
    // await prisma.userCode.upsert({
    //   where: { phone },
    //   update: {
    //     code,
    //     fullname,
    //     city,
    //   },
    //   create: {
    //     phone,
    //     code,
    //     fullname,
    //     city,
    //   },
    // });

    // Отправка кода на телефон
    await sendSMSCode(phone, code);

    res.json({
      success: true,
    });
  } catch (error) {
    console.error("Ошибка при обработке запроса:", error);
    res.status(500).json({
      error: "Внутренняя ошибка сервера",
    });
  }
});

// app.post("/verify", async (req, res) => {
//   try {
//     const { phone, otp } = req.body;

//     // Валидация обязательных полей
//     if (!phone || !otp) {
//       return res.status(400).json({
//         error: "Необходимо указать phone и otp",
//       });
//     }

//     // Поиск данных пользователя в БД
//     // const userData = await prisma.userCode.findUnique({
//     //   where: { phone },
//     // });

//     // if (!userData) {
//     //   return res.status(404).json({
//     //     error:
//     //       "Код не найден. Возможно, истек срок действия или телефон неверен.",
//     //   });
//     // }

//     // Проверка, не был ли код уже использован
//     // if (userData.verified) {
//     //   return res.status(400).json({
//     //     error: "Код уже был использован",
//     //   });
//     // }

//     // Проверка совпадения кода
//     if (userData.code !== otp) {
//       return res.status(400).json({
//         error: "Неверный код",
//       });
//     }

//     // Код совпал - отправляем контакты на почту
//     // await sendUserContacts(userData.fullname, userData.phone, userData.city);

//     // Помечаем код как использованный
//     await prisma.userCode.update({
//       where: { phone },
//       data: { verified: true },
//     });

//     res.json({
//       success: true,
//       message: "Код подтвержден. Контакты отправлены на почту.",
//     });
//   } catch (error) {
//     console.error("Ошибка при проверке кода:", error);
//     res.status(500).json({
//       error: "Внутренняя ошибка сервера",
//     });
//   }
// });

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
