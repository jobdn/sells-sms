function normalizeRuPhone(raw) {
  if (!raw) return "";

  // 1. Оставляем только цифры
  let digits = String(raw).replace(/\D+/g, "");

  // 2. Убираем ведущие 8 / 7 / 00, приводим к формату 7XXXXXXXXXX
  // варианты:
  //  - 8908... -> 7908...
  //  - 7908... -> 7908...
  //  - 908...  -> 7908...
  if (digits.length === 11 && digits[0] === "8") {
    // 8908... -> 7908...
    digits = "7" + digits.slice(1);
  } else if (digits.length === 10 && digits[0] === "9") {
    // 908... -> 7908...
    digits = "7" + digits;
  } else if (digits.length > 11 && digits.startsWith("007")) {
    // на всякий случай, если пришло как 0079...
    digits = "7" + digits.slice(-10);
  }

  // На выходе хотим всегда 11 цифр и первую 7
  if (digits.length !== 11 || digits[0] !== "7") {
    // если номер странный, можешь тут вернуть '' или исходный digits
    return;
  }

  return digits;
}

module.exports = {
  normalizeRuPhone,
};
