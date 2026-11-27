import { getBandRecords, BandRecord } from "./bandRecordService";
import {
  getStockSummary,
  getFeedDeliveries,
  StockSummary,
  FeedDelivery,
} from "./inventoryService";

export interface FeedingData {
  records: BandRecord[];
  stock: StockSummary;
  deliveries: FeedDelivery[];
  errors: {
    records: boolean;
    stock: boolean;
    deliveries: boolean;
  };
}

export interface DailyFeedingSummary {
  date: string;
  nombre_sacs: number;
  quantite_aliment_kg: number;
  eau_litres: number;
  nombre_bandes: number;
}

const emptyStock: StockSummary = {
  unite: "sacs",
  nombre_types_aliments: 0,
  stocks: [],
  consommation_sans_code: 0,
};

export const getFeedingData = async (): Promise<FeedingData> => {
  const [recordsResult, stockResult, deliveriesResult] =
    await Promise.allSettled([
      getBandRecords(),
      getStockSummary(),
      getFeedDeliveries(),
    ]);

  const records =
    recordsResult.status === "fulfilled" && Array.isArray(recordsResult.value)
      ? recordsResult.value
      : [];

  const stock =
    stockResult.status === "fulfilled" &&
    stockResult.value &&
    Array.isArray(stockResult.value.stocks)
      ? stockResult.value
      : emptyStock;

  const deliveries =
    deliveriesResult.status === "fulfilled" &&
    Array.isArray(deliveriesResult.value)
      ? deliveriesResult.value
      : [];

  return {
    records,
    stock,
    deliveries,
    errors: {
      records: recordsResult.status === "rejected",
      stock: stockResult.status === "rejected",
      deliveries: deliveriesResult.status === "rejected",
    },
  };
};

export const getDailyFeedingSummary = (
  records: BandRecord[],
): DailyFeedingSummary[] => {
  const summaryMap = new Map<string, DailyFeedingSummary>();

  records.forEach((record) => {
    const date = record.date_releve;

    if (!date) return;

    const current = summaryMap.get(date) ?? {
      date,
      nombre_sacs: 0,
      quantite_aliment_kg: 0,
      eau_litres: 0,
      nombre_bandes: 0,
    };

    current.nombre_sacs += Number(record.nombre_sacs) || 0;
    current.quantite_aliment_kg += Number(record.quantite_aliment_kg) || 0;
    current.eau_litres += Number(record.eau_litres) || 0;
    current.nombre_bandes += 1;

    summaryMap.set(date, current);
  });

  return Array.from(summaryMap.values()).sort((a, b) =>
    b.date.localeCompare(a.date),
  );
};
