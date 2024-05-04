def validate_ean13(code: str) -> bool:
  try:
    digits = [int(digit) for digit in list(code)]
  except ValueError:
    return False  # If the code isn't entirely integers, it's
    # obviously not a UPC code.

  if len(digits) != 13:
    return False  # EAN-13 is 13 digits.

  # https://en.wikipedia.org/wiki/International_Article_Number#Calculation_of_checksum_digit
  check_digit = digits.pop()
  odd_digits = digits[::2]
  even_digits = digits[1::2]

  odd_sum = sum(odd_digits)
  even_sum = sum(even_digits)

  total_sum = odd_sum + (even_sum * 3)
  result = total_sum % 10
  if result == 0 and check_digit == 0:
    return True
  elif (10 - result) == check_digit:
    return True
  else:
    return False
