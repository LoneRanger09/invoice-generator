/**
 * Converts a numeric amount into words using the Indian Numbering System
 * (Crore, Lakh, Thousand, Hundred, Tens, Units, and Paise).
 * Example: 10166.00 -> "Rs. Ten Thousand One Hundred Sixty Six Only"
 * Example: 123456.50 -> "Rs. One Lakh Twenty Three Thousand Four Hundred Fifty Six and Fifty Paise Only"
 */

const units = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertLessThanThousand(n: number): string {
  if (n === 0) return '';
  let str = '';
  if (n >= 100) {
    str += units[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
  }
  if (n >= 20) {
    str += tens[Math.floor(n / 10)] + ' ';
    n %= 10;
  }
  if (n > 0) {
    str += units[n] + ' ';
  }
  return str.trim();
}

export function numberToWordsINR(amount: number): string {
  if (isNaN(amount) || amount < 0) return 'Rs. Zero Only';
  if (amount === 0) return 'Rs. Zero Only';

  const totalPaise = Math.round((amount + Number.EPSILON) * 100);
  const rupees = Math.floor(totalPaise / 100);
  const paise = totalPaise % 100;

  if (rupees === 0 && paise === 0) return 'Rs. Zero Only';

  let rupeesStr = '';

  if (rupees > 0) {
    let num = rupees;

    const crore = Math.floor(num / 10000000);
    num %= 10000000;

    const lakh = Math.floor(num / 100000);
    num %= 100000;

    const thousand = Math.floor(num / 1000);
    num %= 1000;

    const hundredAndRest = num;

    if (crore > 0) {
      rupeesStr += convertLessThanThousand(crore) + ' Crore ';
    }
    if (lakh > 0) {
      rupeesStr += convertLessThanThousand(lakh) + ' Lakh ';
    }
    if (thousand > 0) {
      rupeesStr += convertLessThanThousand(thousand) + ' Thousand ';
    }
    if (hundredAndRest > 0) {
      rupeesStr += convertLessThanThousand(hundredAndRest) + ' ';
    }
  }

  rupeesStr = rupeesStr.trim();

  let result = 'Rs. ';
  if (rupeesStr) {
    result += rupeesStr;
  } else if (paise > 0) {
    result += 'Zero';
  }

  if (paise > 0) {
    const paiseText = convertLessThanThousand(paise);
    result += ` and ${paiseText} Paise Only`;
  } else {
    result += ' Only';
  }

  return result;
}
