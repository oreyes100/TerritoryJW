import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  useColorScheme,
  ActivityIndicator,
  TouchableOpacity,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTerritory } from '~/hooks/useTerritory';
import { Territory } from '~/types/Territory';
import { styles } from 'components/styles';

// ─── helpers ────────────────────────────────────────────────────────────────

const formatDate = (value: any): string => {
  if (!value) return '—';
  try {
    const date = value?.toDate ? value.toDate() : new Date(value);
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return '—';
  }
};

const formatDateShort = (value: any): string => {
  if (!value) return '—';
  try {
    const date = value?.toDate ? value.toDate() : new Date(value);
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return '—';
  }
};

const isCompleted = (t: Territory) => !!t.visitStartDate && !!t.visitEndDate;

// ─── sort options ────────────────────────────────────────────────────────────

type SortKey = 'number_asc' | 'number_desc' | 'date_asc' | 'date_desc';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'number_asc', label: 'Nº ↑' },
  { key: 'number_desc', label: 'Nº ↓' },
  { key: 'date_asc', label: 'Fecha ↑' },
  { key: 'date_desc', label: 'Fecha ↓' },
];

const sortTerritories = (list: Territory[], sort: SortKey): Territory[] => {
  return [...list].sort((a, b) => {
    if (sort === 'number_asc') return a.number - b.number;
    if (sort === 'number_desc') return b.number - a.number;

    const dateA = a.visitEndDate ? new Date(a.visitEndDate).getTime() : 0;
    const dateB = b.visitEndDate ? new Date(b.visitEndDate).getTime() : 0;
    if (sort === 'date_asc') return dateA - dateB;
    return dateB - dateA; // date_desc
  });
};

// ─── component ───────────────────────────────────────────────────────────────

export default function TerritoryReport() {
  const { territories, isLoading, error } = useTerritory({ revalidateOnFocus: false });
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [sortKey, setSortKey] = useState<SortKey>('number_asc');

  const completedTerritories = useMemo(
    () => sortTerritories(territories.filter(isCompleted), sortKey),
    [territories, sortKey]
  );

  const stats = useMemo(() => {
    const total = territories.length;
    const completed = territories.filter(isCompleted).length;
    const incomplete = territories.filter((t) => t.visitStartDate && !t.visitEndDate).length;
    const ready = total - completed - incomplete;
    return { total, completed, incomplete, ready };
  }, [territories]);

  // ── share / export ──
  const handleShare = async () => {
    const lines = completedTerritories.map(
      (t) => `Territorio ${t.number} — ${t.name}\n  Inicio: ${formatDateShort(t.visitStartDate)}\n  Completado: ${formatDateShort(t.visitEndDate)}${t.note ? `\n  Nota: ${t.note}` : ''}`
    );
    const header = `📋 REPORTE DE TERRITORIOS COMPLETADOS\n${'─'.repeat(38)}\nTotal completados: ${stats.completed} / ${stats.total}\n${'─'.repeat(38)}\n\n`;
    const body = lines.join('\n\n');
    const footer = `\n\n${'─'.repeat(38)}\nGenerado el ${formatDate(new Date())}`;

    try {
      await Share.share({ message: header + body + footer, title: 'Reporte de Territorios' });
    } catch (e) {
      // user cancelled
    }
  };

  // ── loading / error states ──
  if (isLoading)
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-100 dark:bg-black2">
        <ActivityIndicator size="large" color={isDark ? '#9CA3AF' : '#3b82f6'} />
        <Text className="mt-4 text-gray-900 dark:text-gray-100">Cargando reporte...</Text>
      </SafeAreaView>
    );

  if (error)
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-100 dark:bg-black2">
        <Text className="text-gray-900 dark:text-gray-100">Error: {error.message}</Text>
      </SafeAreaView>
    );

  // ── main render ──
  return (
    <SafeAreaView className={styles.SAV}>
      {/* ── Header ── */}
      <View className={styles.containerPage}>
        <View className="flex-row items-center justify-between">
          <Text className={styles.pageTitle}>Reporte</Text>
          <TouchableOpacity
            onPress={handleShare}
            className="rounded-xl bg-purple-100 px-3 py-2 dark:bg-purple-900/40">
            <View className="flex-row items-center gap-1">
              <Ionicons
                name="share-outline"
                size={18}
                color={isDark ? '#c4b5fd' : '#7c3aed'}
              />
              <Text className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                Exportar
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 12 }} showsVerticalScrollIndicator={false}>

        {/* ── Stats summary ── */}
        <View className="mb-4 flex-row gap-2">
          <StatCard label="Total" value={stats.total} color="#6b7280" isDark={isDark} />
          <StatCard label="Listos" value={stats.ready} color="#3b82f6" isDark={isDark} />
          <StatCard label="En curso" value={stats.incomplete} color="#eab308" isDark={isDark} />
          <StatCard label="Terminados" value={stats.completed} color="#22c55e" isDark={isDark} />
        </View>

        {/* ── Sort bar ── */}
        <View className="mb-3 flex-row items-center gap-2">
          <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400">Ordenar:</Text>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setSortKey(opt.key)}
              className={`rounded-full px-3 py-1 ${
                sortKey === opt.key
                  ? 'bg-purple-600'
                  : 'bg-white dark:bg-black3'
              }`}>
              <Text
                className={`text-xs font-semibold ${
                  sortKey === opt.key ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                }`}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Section title ── */}
        <Text className="mb-2 text-base font-bold text-gray-700 dark:text-gray-200">
          Territorios completados ({completedTerritories.length})
        </Text>

        {/* ── List ── */}
        {completedTerritories.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons
              name="checkmark-done-circle-outline"
              size={56}
              color={isDark ? '#4b5563' : '#d1d5db'}
            />
            <Text className="mt-3 text-center text-base text-gray-400 dark:text-gray-500">
              Ningún territorio completado todavía
            </Text>
          </View>
        ) : (
          completedTerritories.map((territory, index) => (
            <TerritoryReportRow
              key={territory.id}
              territory={territory}
              index={index}
              isDark={isDark}
            />
          ))
        )}

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
  isDark,
}: {
  label: string;
  value: number;
  color: string;
  isDark: boolean;
}) {
  return (
    <View
      className="flex-1 items-center rounded-2xl bg-white py-3 shadow-sm dark:bg-black3"
      style={{ borderTopWidth: 3, borderTopColor: color }}>
      <Text className="text-xl font-bold text-gray-900 dark:text-white">{value}</Text>
      <Text className="text-xs text-gray-500 dark:text-gray-400">{label}</Text>
    </View>
  );
}

function TerritoryReportRow({
  territory,
  index,
  isDark,
}: {
  territory: Territory;
  index: number;
  isDark: boolean;
}) {
  return (
    <View className="mb-3 overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-black3">
      {/* ── left badge + content row ── */}
      <View className="flex-row">
        {/* Number badge */}
        <View className="w-20 items-center justify-center bg-green-500 py-4">
          <Text className="text-2xl font-bold text-white">{territory.number}</Text>
          <Text className="text-xs font-medium text-green-100">T-{territory.number}</Text>
        </View>

        {/* Content */}
        <View className="flex-1 px-3 py-3">
          <Text className="text-base font-semibold text-gray-900 dark:text-white" numberOfLines={1}>
            {territory.name}
          </Text>

          {/* Dates */}
          <View className="mt-2 gap-1">
            <View className="flex-row items-center gap-1">
              <Ionicons
                name="play-circle-outline"
                size={14}
                color={isDark ? '#9ca3af' : '#6b7280'}
              />
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                Inicio:{' '}
                <Text className="font-medium text-gray-700 dark:text-gray-200">
                  {formatDate(territory.visitStartDate)}
                </Text>
              </Text>
            </View>

            <View className="flex-row items-center gap-1">
              <Ionicons
                name="checkmark-circle-outline"
                size={14}
                color="#22c55e"
              />
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                Completado:{' '}
                <Text className="font-semibold text-green-600 dark:text-green-400">
                  {formatDate(territory.visitEndDate)}
                </Text>
              </Text>
            </View>
          </View>

          {/* Note (optional) */}
          {!!territory.note && (
            <View className="mt-2 rounded-md bg-slate-100 px-2 py-1 dark:bg-black2">
              <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={2}>
                📝 {territory.note}
              </Text>
            </View>
          )}
        </View>

        {/* Index chip */}
        <View className="items-center justify-start px-2 pt-3">
          <Text className="text-xs text-gray-300 dark:text-gray-600">#{index + 1}</Text>
        </View>
      </View>
    </View>
  );
}
