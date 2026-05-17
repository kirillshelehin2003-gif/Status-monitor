import { PrismaClient, CheckSource, IncidentSource, ServiceCategory, ServiceStatus } from "@prisma/client";

const prisma = new PrismaClient();

type SeedService = {
  name: string;
  slug: string;
  category: ServiceCategory;
  description: string;
  homepageUrl: string;
  healthCheckUrl: string;
  regions: string[];
  profile: {
    availability: number;
    problemScore: number;
    confidence: number;
    status: ServiceStatus;
    affectedRegions: string[];
    reasons: string[];
    trendQueries: string[];
    trendScore: number;
  };
};

const services: SeedService[] = [
  {
    name: "Steam",
    slug: "steam",
    category: ServiceCategory.games,
    description: "Магазин игр, авторизация, загрузки и игровые сервисы.",
    homepageUrl: "https://store.steampowered.com",
    healthCheckUrl: "https://store.steampowered.com",
    regions: ["Россия", "Европа", "США"],
    profile: {
      availability: 98,
      problemScore: 10,
      confidence: 0.62,
      status: ServiceStatus.operational,
      affectedRegions: [],
      reasons: [],
      trendQueries: ["Steam не работает", "Steam ошибка входа", "Steam сбой сегодня"],
      trendScore: 16
    }
  },
  {
    name: "ВКонтакте",
    slug: "vk",
    category: ServiceCategory.social,
    description: "Соцсеть, лента, сообщения, музыка и видео.",
    homepageUrl: "https://vk.com",
    healthCheckUrl: "https://vk.com",
    regions: ["Россия", "СНГ"],
    profile: {
      availability: 99,
      problemScore: 8,
      confidence: 0.58,
      status: ServiceStatus.operational,
      affectedRegions: [],
      reasons: [],
      trendQueries: ["VK сбой сегодня", "ВКонтакте не открывается", "ВК не грузит сообщения"],
      trendScore: 12
    }
  },
  {
    name: "MAX",
    slug: "max",
    category: ServiceCategory.messenger,
    description: "Мессенджер: сообщения, медиа, авторизация и звонки.",
    homepageUrl: "https://max.ru",
    healthCheckUrl: "https://max.ru",
    regions: ["Россия"],
    profile: {
      availability: 98,
      problemScore: 9,
      confidence: 0.68,
      status: ServiceStatus.operational,
      affectedRegions: [],
      reasons: [],
      trendQueries: ["MAX не отправляет сообщения", "MAX не работает", "MAX сбой сегодня"],
      trendScore: 14
    }
  },
  {
    name: "Telegram",
    slug: "telegram",
    category: ServiceCategory.messenger,
    description: "Мессенджер, каналы, звонки и загрузка медиа.",
    homepageUrl: "https://telegram.org",
    healthCheckUrl: "https://telegram.org",
    regions: ["Россия", "Европа", "Ближний Восток"],
    profile: {
      availability: 98,
      problemScore: 10,
      confidence: 0.6,
      status: ServiceStatus.operational,
      affectedRegions: [],
      reasons: [],
      trendQueries: ["почему не работает Telegram", "Telegram долго подключается", "Telegram сбой"],
      trendScore: 18
    }
  },
  {
    name: "Discord",
    slug: "discord",
    category: ServiceCategory.messenger,
    description: "Голос, чаты, стримы и авторизация сообществ.",
    homepageUrl: "https://discord.com",
    healthCheckUrl: "https://discord.com",
    regions: ["Европа", "США"],
    profile: {
      availability: 97,
      problemScore: 11,
      confidence: 0.61,
      status: ServiceStatus.operational,
      affectedRegions: [],
      reasons: [],
      trendQueries: ["Discord не работает", "Discord RTC connecting", "Discord сбой сегодня"],
      trendScore: 17
    }
  },
  {
    name: "YouTube",
    slug: "youtube",
    category: ServiceCategory.video,
    description: "Видео, трансляции, авторизация и рекомендации.",
    homepageUrl: "https://www.youtube.com",
    healthCheckUrl: "https://www.youtube.com",
    regions: ["Глобально"],
    profile: {
      availability: 98,
      problemScore: 9,
      confidence: 0.64,
      status: ServiceStatus.operational,
      affectedRegions: [],
      reasons: [],
      trendQueries: ["YouTube не загружается", "YouTube сбой сегодня", "почему не работает YouTube"],
      trendScore: 16
    }
  },
  {
    name: "Roblox",
    slug: "roblox",
    category: ServiceCategory.games,
    description: "Игровая платформа, вход, покупки и игровые серверы.",
    homepageUrl: "https://www.roblox.com",
    healthCheckUrl: "https://www.roblox.com",
    regions: ["Европа", "США", "Азия"],
    profile: {
      availability: 97,
      problemScore: 10,
      confidence: 0.66,
      status: ServiceStatus.operational,
      affectedRegions: [],
      reasons: [],
      trendQueries: ["Roblox не работает", "Roblox error 503", "Roblox сбой"],
      trendScore: 18
    }
  },
  {
    name: "Google",
    slug: "google",
    category: ServiceCategory.search,
    description: "Поиск, аккаунты и базовые веб-сервисы.",
    homepageUrl: "https://www.google.com",
    healthCheckUrl: "https://www.google.com",
    regions: ["Глобально"],
    profile: {
      availability: 99,
      problemScore: 4,
      confidence: 0.7,
      status: ServiceStatus.operational,
      affectedRegions: [],
      reasons: [],
      trendQueries: ["Google не работает", "Google поиск сбой", "Google login error"],
      trendScore: 9
    }
  },
  {
    name: "Twitch",
    slug: "twitch",
    category: ServiceCategory.video,
    description: "Стримы, чат, подписки и видеодоставка.",
    homepageUrl: "https://www.twitch.tv",
    healthCheckUrl: "https://www.twitch.tv",
    regions: ["Европа", "США"],
    profile: {
      availability: 97,
      problemScore: 11,
      confidence: 0.57,
      status: ServiceStatus.operational,
      affectedRegions: [],
      reasons: [],
      trendQueries: ["Twitch не грузит стрим", "Twitch buffering", "Twitch сбой"],
      trendScore: 16
    }
  },
  {
    name: "GitHub",
    slug: "github",
    category: ServiceCategory.cloud,
    description: "Git, Actions, Packages и API для разработки.",
    homepageUrl: "https://github.com",
    healthCheckUrl: "https://github.com",
    regions: ["Глобально"],
    profile: {
      availability: 99,
      problemScore: 6,
      confidence: 0.62,
      status: ServiceStatus.operational,
      affectedRegions: [],
      reasons: [],
      trendQueries: ["GitHub status", "GitHub Actions down", "GitHub не работает"],
      trendScore: 11
    }
  },
  {
    name: "Binance",
    slug: "binance",
    category: ServiceCategory.finance,
    description: "Биржа, авторизация, API и платежные операции.",
    homepageUrl: "https://www.binance.com",
    healthCheckUrl: "https://www.binance.com",
    regions: ["Европа", "Азия"],
    profile: {
      availability: 98,
      problemScore: 7,
      confidence: 0.56,
      status: ServiceStatus.operational,
      affectedRegions: [],
      reasons: [],
      trendQueries: ["Binance не работает", "Binance API error", "Binance login problem"],
      trendScore: 12
    }
  },
  {
    name: "Yandex Cloud",
    slug: "yandex-cloud",
    category: ServiceCategory.cloud,
    description: "Облачная инфраструктура, API, DNS и managed-сервисы.",
    homepageUrl: "https://cloud.yandex.ru",
    healthCheckUrl: "https://cloud.yandex.ru",
    regions: ["Россия"],
    profile: {
      availability: 98,
      problemScore: 8,
      confidence: 0.56,
      status: ServiceStatus.operational,
      affectedRegions: [],
      reasons: [],
      trendQueries: ["Yandex Cloud status", "Yandex Cloud API сбой", "Яндекс Облако не работает"],
      trendScore: 12
    }
  }
];

async function main() {
  console.log("Seeding services...");

  for (const item of services) {
    const service = await prisma.service.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        category: item.category,
        description: item.description,
        homepageUrl: item.homepageUrl,
        healthCheckUrl: item.healthCheckUrl,
        regions: item.regions,
        enabled: true,
        mockSignalProfile: item.profile
      },
      create: {
        name: item.name,
        slug: item.slug,
        category: item.category,
        description: item.description,
        homepageUrl: item.homepageUrl,
        healthCheckUrl: item.healthCheckUrl,
        regions: item.regions,
        enabled: true,
        mockSignalProfile: item.profile
      }
    });

    await prisma.healthCheck.deleteMany({ where: { serviceId: service.id } });
    await prisma.searchTrend.deleteMany({ where: { serviceId: service.id } });
    await prisma.userReport.deleteMany({ where: { serviceId: service.id } });
    await prisma.incident.deleteMany({ where: { serviceId: service.id } });
    await prisma.manualOverride.deleteMany({ where: { serviceId: service.id } });

    await prisma.healthCheck.createMany({
      data: buildHistory(service.id, item)
    });

    await prisma.searchTrend.createMany({
      data: item.profile.trendQueries.map((query, index) => ({
        serviceId: service.id,
        query,
        score: Math.max(1, item.profile.trendScore - index * 8),
        source: "seed-dev-mock",
        capturedAt: new Date(Date.now() - index * 18 * 60 * 1000)
      }))
    });

    if (item.profile.problemScore >= 35) {
      await prisma.incident.create({
        data: {
          serviceId: service.id,
          title:
            item.profile.status === ServiceStatus.major_outage
              ? `Массовый сбой ${item.name}`
              : `Деградация ${item.name}`,
          status: item.profile.status,
          source: IncidentSource.automatic,
          startedAt: new Date(Date.now() - (item.profile.status === ServiceStatus.major_outage ? 3 : 2) * 60 * 60 * 1000),
          affectedRegions: item.profile.affectedRegions,
          suspectedReasons: item.profile.reasons,
          summary: `Seed-инцидент для демонстрации истории: ${item.profile.reasons[0] ?? "аномальный рост сигналов"}.`
        }
      });
    }

    if (item.profile.problemScore >= 25) {
      await prisma.userReport.createMany({
        data: buildReports(service.id, item)
      });
    }
  }

  await prisma.checkLog.deleteMany({ where: { source: "seed" } });
  await prisma.checkLog.create({
    data: {
      level: "info",
      source: "seed",
      message: `Seed completed: ${services.length} services with deterministic history.`
    }
  });

  console.log("Seed done.");
}

function buildHistory(serviceId: string, item: SeedService) {
  const rows = [];
  const now = Date.now();
  const points = 30 * 24;
  for (let index = points - 1; index >= 0; index -= 1) {
    const checkedAt = new Date(now - index * 60 * 60 * 1000);
    const wave = Math.sin((points - index + item.slug.length) / 7) * 5;
    const daily = Math.cos((points - index) / 24) * 3;
    const isCurrentWindow = index < 4 && item.profile.problemScore >= 35;
    const problemScore = clamp(item.profile.problemScore + wave + daily + (isCurrentWindow ? 8 : -6));
    const availability = clamp(item.profile.availability - problemScore * 0.08 + (100 - item.profile.availability) * 0.04, 0, 100);
    const status = statusFrom(problemScore, availability);

    rows.push({
      serviceId,
      source: CheckSource.dev_mock,
      checkedAt,
      status,
      latencyMs: Math.round(110 + problemScore * 8 + Math.abs(wave) * 12),
      availability,
      problemScore,
      confidence: item.profile.confidence,
      affectedRegions: status === ServiceStatus.operational ? [] : item.profile.affectedRegions,
      suspectedReasons: status === ServiceStatus.operational ? [] : item.profile.reasons,
      message:
        status === ServiceStatus.operational
          ? "Seed history: сервис работал в пределах нормы."
          : `Seed history: ${item.profile.reasons[0] ?? "аномалия сигналов"}.`,
      raw: {
        seed: true,
        deterministic: true
      }
    });
  }
  return rows;
}

function buildReports(serviceId: string, item: SeedService) {
  const count = Math.min(28, Math.max(4, Math.round(item.profile.problemScore / 3)));
  return Array.from({ length: count }).map((_, index) => ({
    serviceId,
    region: item.profile.affectedRegions[index % Math.max(1, item.profile.affectedRegions.length)] ?? item.regions[0],
    reason: item.profile.reasons[index % Math.max(1, item.profile.reasons.length)] ?? "не работает приложение",
    message: `${item.name}: пользовательская жалоба seed #${index + 1}`,
    createdAt: new Date(Date.now() - index * 11 * 60 * 1000)
  }));
}

function statusFrom(problemScore: number, availability: number): ServiceStatus {
  if (problemScore >= 70 || availability <= 55) return ServiceStatus.major_outage;
  if (problemScore >= 30 || availability <= 90) return ServiceStatus.partial_outage;
  return ServiceStatus.operational;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
