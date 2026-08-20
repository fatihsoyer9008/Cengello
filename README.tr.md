<div align="center">

🇬🇧 [English](README.md) · 🇹🇷 **Türkçe**

# 🗂️ Cengello

**Full-stack, kendi sunucunda barındırdığın bir Trello klonu** — Kanban panoları, sürükle-bırak kartlar, kontrol listeleri, etkinlik akışları ve kişisel bir Gelen Kutusu; Next.js ve FastAPI ile yazıldı.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)](#)
[![Version](https://img.shields.io/badge/version-0.1.0-blue?style=flat-square)](#)
[![License](https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](#-teknoloji-yığını)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](#-teknoloji-yığını)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](#-teknoloji-yığını)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](#-başlarken)

</div>

---

## 📖 Giriş

**Cengello**, sıfırdan bir öğrenme projesi ve portföy çalışması olarak inşa edilmiş, full-stack, kendi sunucunda barındırdığın bir proje yönetim aracıdır. Modern bir Kanban aracının temel iş akışını yeniden üretir — çalışma alanları, panolar, renkli listeler, sürüklenebilir kartlar, kontrol listeleri, etiketler, bitiş tarihleri, ekler ve canlı bir etkinlik akışı — hepsi kendi Docker Compose yığınının arkasında.

Gerçek bir production mimarisiyle inşa edildi: PostgreSQL ve Alembic migration'ları ile desteklenen tip güvenli bir FastAPI backend, Tailwind CSS ile stillendirilmiş bir Next.js/React frontend — hepsi Docker Compose ile birbirine bağlı, böylece herkes birkaç komutla kendi bilgisayarında tüm yığını ayağa kaldırabilir. Kayıt olunacak barındırılan bir sürüm yok; kendin çalıştırırsın.

> 🖼️ **Ekran Görüntüsü / Demo**
>
> _Pano görünümünün bir ekran görüntüsü veya GIF'i buraya gelecek — örneğin `docs/demo.gif` veya `docs/demo.png` ekleyip `![Cengello Demo](docs/demo.gif)` şeklinde referans verebilirsin._

---

## ✨ Öne Çıkan Özellikler

- 🗃️ **Çalışma Alanları & Panolar** — panoları rol tabanlı üyelikle (owner / admin / member) takım çalışma alanlarında organize et.
- 📌 **Kanban Pano Görünümü** — renkli, sürüklenebilir listeler ve kartlar, `dnd-kit` ile canlı sürükle-bırak sıralama.
- 🎨 **Özel Pano Arka Planları & Görünürlük** — canlı önizlemeyle yüksek çözünürlüklü bir fotoğraf arka planı veya gradyan seç, her panoyu gizli, çalışma alanına özel veya herkese açık yap.
- 🌓 **Karanlık Mod Arayüzü** — uygulamanın tamamında, istediğin zaman değiştirebileceğin şık bir karanlık tema.
- ✅ **Kontrol Listeleri & İlerleme Takibi** — iç içe kontrol listesi öğeleri, canlı tamamlanma yüzdesi çubukları, çoklu satır yapıştırma (satır başına bir öğe), hem kartlar hem de kontrol listesi öğeleri için art arda "Enter'a basıp bir tane daha ekle" girişi.
- 🔗 **Bağlantıyla Davet Et** — "Paylaş" menüsünden paylaşılabilir bir pano bağlantısı oluştur; bağlantıyı açan herkes (giriş yaptıktan sonra) otomatik olarak panoya katılır.
- 🏷️ **Etiketler, Üyeler & Bitiş Tarihleri** — kartları etiketle, takım arkadaşlarını ata, görsel bitiş-durumu göstergeleriyle son tarihleri takip et.
- 📎 **Ekler & Kapak Görselleri** — bir karta dosya yükle ve birini kapak görseli olarak öne çıkar.
- 💬 **Birleşik Yorumlar & Etkinlik Akışı** — Markdown yorumları, kart başına eksiksiz, insan tarafından okunabilir bir denetim günlüğüyle iç içe geçmiş halde.
- 📥 **Kişisel Gelen Kutusu** — herhangi bir panodan bağımsız, hızlı yapılacaklar için özel, panolar arası bir yakalama listesi.
- 🤖 **Butler Tarzı Otomasyon Kuralları** — pano başına tetikleyici/eylem otomasyon kuralları (örn. bir koşul sağlandığında kartı taşı).
- 🧩 **Özel Alanlar & Şablonlar** — pano başına özel alanlar tanımla, panoları veya kartları yeniden kullanılabilir şablonlar olarak yakala.
- 🔐 **JWT Kimlik Doğrulama** — httpOnly refresh cookie'leriyle access/refresh token tabanlı kimlik doğrulama.

---

## 🛠️ Teknoloji Yığını

**Frontend**
- ⚛️ [Next.js 14](https://nextjs.org/) (App Router) + [React 18](https://react.dev/)
- 🎨 Stillendirme için [Tailwind CSS](https://tailwindcss.com/)
- 🧊 [Radix UI](https://www.radix-ui.com/) primitifleri (Dialog, Popover, Dropdown, Tabs)
- 🖱️ Sürükle-bırak için [dnd-kit](https://dndkit.com/)
- 🔄 Veri çekme & önbellekleme için [TanStack Query](https://tanstack.com/query)
- 🖼️ İkonlar için [lucide-react](https://lucide.dev/)
- 📝 Kart açıklamalarını & yorumları render etmek için [react-markdown](https://github.com/remarkjs/react-markdown)

**Backend**
- ⚡ [FastAPI](https://fastapi.tiangolo.com/) (Python 3.12)
- 🗄️ [SQLAlchemy 2.0](https://www.sqlalchemy.org/) üzerinden [PostgreSQL 16](https://www.postgresql.org/)
- 🧬 Veritabanı migration'ları için [Alembic](https://alembic.sqlalchemy.org/)
- ✅ İstek/yanıt doğrulaması için [Pydantic v2](https://docs.pydantic.dev/)
- 🔑 Kimlik doğrulama & şifre hashleme için `PyJWT` + `argon2-cffi`
- 🧪 Test paketi için `pytest` + `httpx`

**DevOps / Altyapı**
- 🐳 **Docker & Docker Compose** — tüm yığın (frontend, backend, veritabanı) tek komutla çalışır

---

## 🚀 Başlarken

### Ön Koşullar

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/)
- Git

### 1. Repoyu klonla

```bash
git clone https://github.com/fatihsoyer9008/Cengello.git
cd Cengello
```

### 2. Ortam değişkenlerini yapılandır

Örnek env dosyasını kopyala ve gerçek değerlerle doldur (özellikle secret'ları):

```bash
cp .env.example .env
```

```env
POSTGRES_USER=cengello
POSTGRES_PASSWORD=change-me
POSTGRES_DB=cengello

JWT_SECRET_KEY=change-me-to-a-long-random-value
JWT_ACCESS_TTL_MIN=20
JWT_REFRESH_TTL_DAYS=30

# yerel geliştirme düz http üzerinden çalışır, o yüzden false kalır
COOKIE_SECURE=false

NEXT_PUBLIC_API_URL=http://localhost:8000
```

> ⚠️ **Gerçek `.env` dosyanı asla commit'leme.** Zaten `.gitignore` kapsamında — push'lamadan önce iki kez kontrol et.

### 3. Yığını başlat

```bash
# önce veritabanını başlat
docker compose up -d db

# veritabanı migration'larını çalıştır
docker compose run --rm backend alembic upgrade head

# backend & frontend'i başlat
docker compose up -d
```

### 4. Uygulamayı aç

| Servis      | URL                               |
|-------------|------------------------------------|
| 🖥️ Frontend | http://localhost:3000             |
| ⚡ API       | http://localhost:8000             |
| 📚 API Docs | http://localhost:8000/docs        |
| 🩺 Sağlık   | http://localhost:8000/health      |
| 🗄️ Postgres | localhost:5432                    |

### Backend test paketini çalıştırma

```bash
docker compose run --rm backend pytest
```

### Yeni bir veritabanı migration'ı oluşturma

`backend/app/models/` altında bir model değiştirdikten sonra:

```bash
docker compose run --rm backend alembic revision --autogenerate -m "değişikliği açıkla"
docker compose run --rm backend alembic upgrade head
```

---

## 📁 Proje Yapısı

```
cengello/
├── backend/            FastAPI uygulaması, SQLAlchemy modelleri, Alembic migration'ları, pytest paketi
├── frontend/           Next.js uygulaması (App Router), Tailwind CSS, React Query
├── docker-compose.yml
├── .env.example
└── LICENSE
```

---

## 🤝 Katkıda Bulunma

Bu öncelikle kişisel bir portföy/öğrenme projesi, ama issue'lar, öneriler ve pull request'ler memnuniyetle karşılanır. Önemsiz olmayan herhangi bir şey için lütfen önce bir issue açın, böylece yaklaşımı birlikte tartışabiliriz.

---

## ⚖️ Sorumluluk Reddi & Yasal Bildirim

> **Bu proje kesinlikle yalnızca eğitim, portföy ve açık kaynak amaçlıdır.**

- **Cengello TİCARİ KULLANIM İÇİN DEĞİLDİR.** Full-stack mühendislik becerilerini göstermek amacıyla oluşturulmuş, kişisel, ticari olmayan bir yazılım projesidir.
- **Cengello, Trello'dan ilham almıştır ancak Trello veya Atlassian ile hiçbir şekilde bağlantılı, onaylı veya ilişkili değildir.**
- "Trello" ve "Atlassian" kendi sahiplerinin ticari markalarıdır. Bu projede Trello veya Atlassian'a ait hiçbir ticari marka, logo veya tescilli varlık kullanılmamaktadır.
- Burada yeniden üretilen tüm UI/UX kavramları, yaygın Kanban tarzı proje yönetimi kalıplarından ilham alan, yazar tarafından bağımsız olarak inşa edilmiş özgün uygulamalardır.
- Bu yazılım herhangi bir garanti olmaksızın **"olduğu gibi"** sağlanmaktadır. Yazar, bu kod tabanının herhangi bir kullanımından, kötüye kullanımından veya deploy edilmesinden doğacak hiçbir sorumluluk kabul etmez.
- Bu kod tabanının herhangi bir bölümünü kişisel/eğitim amaçları dışında kullanmayı planlıyorsan, lütfen uygun haklara sahip olduğundan ve proje adı, marka veya ticari marka çakışmalarını kaldırdığından emin ol.

---

<div align="center">

**Fatih Soyer** tarafından ❤️ ile yapıldı

</div>
