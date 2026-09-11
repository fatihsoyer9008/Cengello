# Gemini görev önerileri

Kart detayındaki **Gemini önerileri → Öneri al** düğmesi, kaydedilmiş kart başlığı ve açıklamasından Türkçe bir özet, uygulanabilir adımlar ve dikkat edilecek noktalar üretir. Öneriler kartı değiştirmez ve veritabanına kaydedilmez. Kart başlığı veya açıklaması değiştiğinde eski öneriler temizlenir.

## Kurulum

1. [Google AI Studio](https://aistudio.google.com/apikey) üzerinden API anahtarı oluşturun.
2. Projenin `.env` dosyasına aşağıdaki değerleri ekleyin:

   ```env
   GEMINI_API_KEY=your-api-key
   GEMINI_MODEL=gemini-3.5-flash-lite
   ```

3. Backend ve frontend imajlarını yeniden oluşturun:

   ```sh
   docker compose up -d --build backend frontend
   ```

Anahtar backend tarafından kullanılır; `NEXT_PUBLIC_` önekiyle tanımlamayın veya Git'e eklemeyin. Anahtar olmadan diğer özellikler çalışmaya devam eder; öneri isteği açıklayıcı bir 503 yanıtı döndürür.

## API ve veri kapsamı

`POST /cards/{card_id}/suggestions` mevcut kimlik doğrulamayı ve en az pano üyesi rolünü gerektirir. Yalnızca ilgili kartın başlığı (en fazla 1.000 karakter) ve açıklaması (en fazla 12.000 karakter) Google'a gönderilir. Yorumlar, ekler ve diğer kartlar gönderilmez. Düğmeye her basılması yeni bir API isteğidir ve Google hesabının kota/ücretlendirmesine tabidir.

Yanıt `summary`, `steps` ve `considerations` alanlarını içerir. Sunucu JSON şemasını doğrular; kota aşımını 429, bağlantı veya geçersiz yanıtı 502, zaman aşımını 504 olarak döndürür. Sağlayıcının ham hata mesajları istemciye iletilmez. İstek zaman aşımı 30 saniyedir.

Model: [Gemini 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite). API: [GenerateContent](https://ai.google.dev/api/generate-content).

## Test

```sh
docker compose run --rm backend pytest app/tests/test_suggestion_service.py
cd frontend
npx tsc --noEmit
```

Servis testleri sağlayıcıyı taklit eder; API anahtarı veya dış ağ gerektirmez.
