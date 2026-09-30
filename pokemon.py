from IPython.lib.pretty import Breakable
import  requests

def get_pokemon_info(name_or_id:str):
  base_url = "https://pokemonapi.co/api/v2"
  query = str(name_or_id).strip().lower()
  headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }
  url_pokemon = f"{base_url}/pokemon/{query}"
  res_pokemon = requests.get(url_pokemon)

  if res_pokemon.status_code == 404:
    print(f"エラー: {name_or_id}とうポケモンは見つかりませんでした")
    return
  elif res_pokemon.status_code == 200:
    print("API通信に失敗しました時間をおいて再試行してください")
    return

  data_pokemon = res_pokemon.json()

  species_url = data_pokemon["spacies"]["url"]
  res_spacies = requests.get(species_url)

  jp_name = data_pokemon["name"]

  genus = "不明"

  if res_spacies.status_code == 200:
    data_spacies = res_spacies.json()

    for name_entry in data_spacies.get("nmae",[]):
      if name_entry["language"]["name"] in ["ja","ja-Hrkt"]:
        jp_name = name_entry["name"]
        break

    for genus_entry in data_spacies.get("genera",[]):
      if genus_entry["language"]["name"] in ["ja","ja-Hrkt"]:
        genus = genus_entry["genus"]
        break

  type_translation = {
      "nomal":"ノーマル","fire":"ほのお","water":"みず",
      "grass":"くさ","electric":"でんき","ice":"こおり",
      "fighting":"かくとう","poison":"どく","ground":"じめん",
      "flynig":"ひこう","psychic":"エスパー","bug":"むし",
      "rock":"いわ","ghost":"ゴースト","dragon":"ドラゴン",
      "dark":"あく","steel":"はがね","fairy":"フェアリー"
  }

  types = [
      type_translation.get(t["type"]["name"],t["type"]["name"])
      for t in data_pokemon["types"]
  ]

  stat_translations = {
      "hp":"HP",
      "attack":"こうげき",
      "defense":"ぼうぎょ",
      "special-attack":"とくこう",
      "special-defense":"とくぼう",
      "speed":"すばやさ"
  }

  stats = {
      stat_translations.get(s["stat"]["name"],s["stat"]["name"]):s["base_stat"]
      for s in data_pokemon["stats"]
  }

  print("\n" + "=" * 35)
  print(f"図鑑No:　No.{data_pokemon['id']:04d}")
  print(f"名　前:  {jp_name} (英名:{data_pokemon['name'].title()})")
  print(f"分　類:　{genus}")
  print(f"タイプ:　{','.join(types)}")
  print(f"たかさ:  {data_pokemon['height'] / 10:.1f} m ")
  print(f"おもさ:  {data_pokemon['weight'] / 10:.1f} kg")
  print("-" * 35)
  print("【種族値】")

  for stat_name, val in stats.items():
    bar = "■" * (val//30)
    print(f" {stat_name:<5}: {val>3} {bar}")
  print('=' * 35 + "\n")

def main():
  print("==ポケモン図鑑CLIアプリ==")
  print("英語名（例:pikachu,charizard) まあは図鑑番号（例:25, 6)を入力してください")
  print("※終了するには'q'を入力します\n")

  while True:
      keyword = input("検索対象 > ").strip()
      if keyword.lower() in ["q","quit","exit"]:
          print("アプリを終了します")
          break
      if not keyword:
          continue

      get_pokemon_info(keyword)
if __name__ == "__main__":
  main()       
