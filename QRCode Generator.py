import qrcode
import json

def input_data(prompt, cast_func=str, optional=False):
    while True:
        try:
            val = input(f"{prompt}: ").strip()
            if not val and optional:
                return None
            return cast_func(val)
        except ValueError:
            print("Valor inválido. Tenta novamente.")

def main():
    print("=== Gerador de QRCode para Despesas ===")
    data = {
        "name": input_data("Nome"),
        "description": input_data("Descrição", optional=True),
        "value": input_data("Valor (€)", float),
        "startDate": input_data("Data de Início (YYYY-MM-DD)"),
        "periodicity": "OneTime",
        "repeatCount": 0,
    }

    json_data = json.dumps(data, ensure_ascii=False)
    qr = qrcode.make(json_data)
    qrName = f"{data["name"]} - {data["startDate"]}.png"
    qr.save(f"{qrName}")
    print(f"\n✅ QRCode guardado como '{qrName}'")

if __name__ == "__main__":
    main()