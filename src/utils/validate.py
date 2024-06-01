from __future__ import annotations

# Validate / Convert UPC/EAN, return code or false
from .upc import validate_upca, convert_upce
from .ean import validate_ean13

def validate(code: str) -> tuple[str|False,dict[str,str]]:
  error = {"upce.converted": False}
  try:
    if len(code) == 8:
      # This is UPC-E, convert it.
      error["upce.converted"] = True
      original = code
      code = convert_upce(code)

    if len(code) == 12:
      # This is UPC-A, validate it.
      error["guess"] = "upca" if not error["upce.converted"] else "upce"
      valid = validate_upca(code)
      if valid:
        if error["upce.converted"]:
          return original,error
        return code,error
      else:
        return False,error

    if len(code) == 13:
      # This is EAN-13, validate it.
      error["guess"] = "ean13"
      valid = validate_ean13(code)
      if valid:
        return code,error
      else:
        return False,error
  except Exception as e:
    error["exception"] = e
    return False,error
  return False,error

def identify_type(code: str) -> str:
  "Takes in a code, and returns an encoding or 'invalid'"
  code,error = validate(code)
  if code is not False:
    return error["guess"]
  else:
    return "invalid"