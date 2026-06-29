import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

type OutfitEntry = {
  dateKey: string;
  dateLabel: string;
  imageUri: string;
  memo: string;
  tags: string[];
};

type WeatherSummary = {
  temperature: number;
  high: number;
  low: number;
  precipitation: number;
  condition: string;
  summary: string;
  location: string;
  timeline: string[];
  activeIndex: number;
};

const STORAGE_KEY = 'ootd_entries_v1';

type ClosetItem = { id: string; name: string; color: string };

// 옷장에 기등록된 아이템 (카테고리별)
const CLOSET_ITEMS: Record<string, ClosetItem[]> = {
  아우터: [
    { id: 'o1', name: '베이지 트렌치코트', color: '#E8DCC8' },
    { id: 'o2', name: '네이비 블레이저', color: '#3A4A6B' },
    { id: 'o3', name: '데님 자켓', color: '#7B95B5' },
    { id: 'o4', name: '카멜 코트', color: '#B5895A' },
    { id: 'o5', name: '블랙 가디건', color: '#2A2A2A' },
    { id: 'o6', name: '카키 야상', color: '#7C7A5A' },
    { id: 'o7', name: '그레이 무스탕', color: '#A8A29A' },
    { id: 'o8', name: '아이보리 패딩', color: '#F0EBE0' },
    { id: 'o9', name: '버건디 자켓', color: '#6B2B35' },
  ],
  상의: [
    { id: 't1', name: '할터 블라우스', color: '#F2C9B8' },
    { id: 't2', name: '화이트 셔츠', color: '#F5F5F0' },
    { id: 't3', name: '블랙 니트', color: '#2A2A2A' },
    { id: 't4', name: '스트라이프 티', color: '#8FA8C8' },
    { id: 't5', name: '베이지 후디', color: '#D8CBB5' },
    { id: 't6', name: '핑크 가디건', color: '#E8B8C2' },
    { id: 't7', name: '카키 맨투맨', color: '#7C7A5A' },
    { id: 't8', name: '머스타드 니트', color: '#C9A23F' },
    { id: 't9', name: '네이비 셔츠', color: '#33415C' },
  ],
  하의: [
    { id: 'b1', name: '슬랙스', color: '#4A4A52' },
    { id: 'b2', name: '데님 스커트', color: '#9AAFC9' },
    { id: 'b3', name: '와이드 팬츠', color: '#C8BBA8' },
    { id: 'b4', name: '블랙 진', color: '#222228' },
    { id: 'b5', name: '플리츠 스커트', color: '#B7A99A' },
    { id: 'b6', name: '카고 팬츠', color: '#6E6A52' },
    { id: 'b7', name: '연청 진', color: '#A9C0D9' },
    { id: 'b8', name: '코듀로이 팬츠', color: '#9C6B3F' },
  ],
  신발: [
    { id: 's1', name: '로퍼', color: '#5C3A28' },
    { id: 's2', name: '스니커즈', color: '#EAEAEA' },
    { id: 's3', name: '첼시 부츠', color: '#2A2320' },
    { id: 's4', name: '메리제인', color: '#4A2C3A' },
    { id: 's5', name: '샌들', color: '#C9A876' },
    { id: 's6', name: '발레 플랫', color: '#E8D5D0' },
  ],
  가방: [
    { id: 'g1', name: '토트백', color: '#C9A876' },
    { id: 'g2', name: '크로스백', color: '#8B5E3C' },
    { id: 'g3', name: '숄더백', color: '#3A3530' },
    { id: 'g4', name: '버킷백', color: '#D8C4A8' },
    { id: 'g5', name: '미니백', color: '#B5495B' },
    { id: 'g6', name: '백팩', color: '#4A4A52' },
  ],
  악세사리: [
    { id: 'a1', name: '실버 목걸이', color: '#D6D6D6' },
    { id: 'a2', name: '골드 이어링', color: '#D4AF37' },
    { id: 'a3', name: '진주 귀걸이', color: '#F0EBE0' },
    { id: 'a4', name: '가죽 벨트', color: '#5C3A28' },
    { id: 'a5', name: '울 머플러', color: '#8FA8C8' },
    { id: 'a6', name: '버킷햇', color: '#7C7A5A' },
  ],
};
const TODAY_WEATHER: WeatherSummary = {
  temperature: 29,
  high: 31,
  low: 24,
  precipitation: 30,
  condition: '대체로 흐림',
  summary: '오전엔 흐리고 오후엔 갬',
  location: '서울',
  timeline: ['0', '3', '6', '9', '12', '15', '18', '21', '24'],
  activeIndex: 6,
};

const CODI_BOOK_SAMPLES = [
  { title: '데일리 캐주얼', date: '6월 28일' },
  { title: '오피스 룩', date: '6월 25일' },
  { title: '주말 나들이', date: '6월 22일' },
  { title: '비 오는 날', date: '6월 19일' },
  { title: '카페 데이트', date: '6월 15일' },
  { title: '미니멀 코디', date: '6월 11일' },
];

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getTodayLabel() {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date());
}

function getCalendarRows(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDay.getDay(); // 0=Sun
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

function makeDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

type TabKey = 'home' | 'calendar' | 'codebook' | 'favorites' | 'mypage';

// state -> URL path
function computePath(tab: TabKey, view: 'grid' | 'detail' | 'edit', idx: number | null) {
  switch (tab) {
    case 'home': return '/home';
    case 'calendar': return '/calendar';
    case 'codebook': return view !== 'grid' && idx != null ? `/codebook/${idx}` : '/codebook';
    case 'favorites': return '/closet';
    case 'mypage': return '/mypage';
    default: return '/home';
  }
}

// today at center (index 3 of 7)
function getWeekDates() {
  const today = new Date();
  const weekdayLabels = ['월', '화', '수', '목', '금', '토', '일'];

  return Array.from({ length: 7 }, (_, index) => {
    const offset = index - 3;
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const dayIndex = (date.getDay() + 6) % 7;

    return {
      key: date.toISOString().slice(0, 10),
      dayLabel: weekdayLabels[dayIndex],
      dayNumber: date.getDate(),
      isToday: offset === 0,
    };
  });
}

export default function App() {
  const { width } = useWindowDimensions();
  const isCompact = width < 390;
  const horizontalPadding = isCompact ? 16 : 20;
  const weekDates = getWeekDates();

  const [fontsLoaded] = useFonts({
    CloudsofaNamgim: require('./assets/Cloudsofa_namgim-Regular.ttf'),
    ...Ionicons.font,
  });

  const today = new Date();
  const calYear = today.getFullYear();
  const calMonth = today.getMonth();
  const calRows = getCalendarRows(calYear, calMonth);
  const calMonthLabel = `${calYear}년 ${calMonth + 1}월`;

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [todayEntry, setTodayEntry] = useState<OutfitEntry | null>(null);
  const [allEntries, setAllEntries] = useState<OutfitEntry[]>([]);
  const [selectedCodiIndex, setSelectedCodiIndex] = useState<number | null>(null);
  const [codiView, setCodiView] = useState<'grid' | 'detail' | 'edit'>('grid');
  const [codiItems, setCodiItems] = useState<Record<string, ClosetItem | null>>({});
  const [codiTitle, setCodiTitle] = useState('');
  const [codiTags, setCodiTags] = useState<string[]>([]);
  const [codiTagInput, setCodiTagInput] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [pickerCategory, setPickerCategory] = useState<string | null>(null);
  const [sheetCategory, setSheetCategory] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetView, setSheetView] = useState<'main' | 'item'>('main');
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'codebook' | 'favorites' | 'mypage'>('home');
  const slideAnim = useRef(new Animated.Value(300)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  function openSheet() {
    setSheetCategory(null);
    setSheetView('main');
    setSheetVisible(true);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 4 }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }

  function closeSheet() {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 300, duration: 220, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setSheetVisible(false));
  }

  useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.textContent = "@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/static/pretendard-dynamic-subset.css'); html, body, #root { background-color: #FFFFFF; } html, body { margin: 0; height: 100%; } #root { display: flex; flex-direction: column; height: 100vh; height: 100dvh; }";
      document.head.appendChild(style);
    }
  }, []);

  // URL <-> state sync (web only)
  function applyPath(pathname: string) {
    const parts = pathname.split('/').filter(Boolean);
    const seg = parts[0] || 'home';
    if (seg === 'calendar') {
      setActiveTab('calendar');
    } else if (seg === 'codebook') {
      setActiveTab('codebook');
      if (parts[1] != null && parts[1] !== '') {
        const idx = Number(parts[1]);
        setSelectedCodiIndex(idx);
        setCodiTitle(CODI_BOOK_SAMPLES[idx]?.title ?? '');
        setCodiView('detail');
      } else {
        setSelectedCodiIndex(null);
        setCodiView('grid');
      }
    } else if (seg === 'closet') {
      setActiveTab('favorites');
    } else if (seg === 'mypage') {
      setActiveTab('mypage');
    } else {
      setActiveTab('home');
    }
  }

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    applyPath(window.location.pathname);
    const onPop = () => applyPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const path = computePath(activeTab, codiView, selectedCodiIndex);
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
  }, [activeTab, codiView, selectedCodiIndex]);

  useEffect(() => {
    async function loadTodayEntry() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const entries = JSON.parse(raw) as OutfitEntry[];
        setAllEntries(entries);
        const entry = entries.find((item) => item.dateKey === getTodayKey()) ?? null;
        setTodayEntry(entry);
        setSelectedImage(entry?.imageUri ?? null);
      } catch {
        Alert.alert('불러오기 실패', '저장된 오늘 코디를 읽는 중 문제가 생겼어요.');
      }
    }
    void loadTodayEntry();
  }, []);

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('권한 필요', '코디 사진을 선택하려면 사진 접근 권한이 필요해요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.85,
    });
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  }

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.appShell}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {activeTab === 'home' && (
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.mobileFrame, { paddingHorizontal: horizontalPadding }]}>

              {/* Date Header */}
              <View style={styles.topHeader}>
                <View style={styles.topTitleRow}>
                  <Text style={styles.topTitle}>Today</Text>
                  <Pressable
                    style={({ pressed }) => [styles.calendarIconBtn, pressed && styles.outfitSlotPressed]}
                    onPress={() => setActiveTab('calendar')}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#888888" />
                  </Pressable>
                </View>
                <View style={styles.weekStrip}>
                  {weekDates.map((item) => (
                    <View key={item.key} style={styles.weekItem}>
                      <Text style={[styles.weekLabel, item.isToday && styles.weekLabelActive]}>
                        {item.dayLabel}
                      </Text>
                      <Text style={[styles.weekDay, item.isToday && styles.weekDayActive]}>
                        {item.dayNumber}
                      </Text>
                      {item.isToday ? <View style={styles.todayUnderline} /> : null}
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.section}>

                {/* Weather Card */}
                <View style={styles.weatherCard}>
                  <View style={styles.weatherLeft}>
                    <View style={styles.weatherLocationRow}>
                      <Ionicons name="location-sharp" size={12} color="#6B7280" />
                      <Text style={styles.weatherLocation}>{TODAY_WEATHER.location}</Text>
                    </View>
                    <Text style={styles.weatherBigTemp}>{TODAY_WEATHER.temperature}°</Text>
                    <Text style={styles.weatherRange}>최저 {TODAY_WEATHER.low}°  최고 {TODAY_WEATHER.high}°</Text>
                  </View>

                  <View style={styles.weatherDivider} />

                  <View style={styles.weatherRight}>
                    <View style={styles.weatherTimeSlot}>
                      <Text style={styles.weatherTimeLabel}>오전</Text>
                      <Image source={require('./assets/sunny.png')} style={styles.weatherTimeIcon} />
                    </View>
                    <View style={styles.weatherTimeSlot}>
                      <Text style={styles.weatherTimeLabel}>오후</Text>
                      <Image source={require('./assets/cloudy.png')} style={styles.weatherTimeIcon} />
                    </View>
                  </View>
                </View>

                {/* Today's Outfit Card */}
                <View style={styles.outfitCard}>
                  <View style={styles.outfitCardHeader}>
                    <Text style={styles.outfitCardTitle}>오늘의 코디</Text>
                    <Pressable
                      style={({ pressed }) => [styles.outfitAddPill, pressed && styles.outfitSlotPressed]}
                      onPress={openSheet}
                    >
                      <Text style={styles.outfitAddPillText}>+ 추가하기</Text>
                    </Pressable>
                  </View>

                  {/* Empty state */}
                  <View style={styles.outfitEmptyBody}>
                    <View style={styles.outfitEmptyIconWrap}>
                      <Text style={styles.outfitEmptyIconText}>👗</Text>
                    </View>
                    <Text style={styles.outfitEmptyText}>오늘의 코디를 추가해보세요.</Text>
                    <Text style={styles.outfitEmptyDeco}>· · ·</Text>
                  </View>
                </View>

              </View>
            </View>
          </ScrollView>
        )}

        {activeTab === 'calendar' && (
          <View style={[styles.screenContainer, { paddingBottom: 0 }]}>
            <View style={styles.calendarHeader}>
              <Text style={styles.screenTitle}>Calendar</Text>
              <Text style={styles.calendarMonthLabel}>{calMonthLabel}</Text>
            </View>
            <View style={styles.calendarDayHeaderRow}>
              {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
                <Text key={d} style={styles.calendarDayHeader}>{d}</Text>
              ))}
            </View>
            <View style={styles.calendarFullGrid}>
              {calRows.map((row, ri) => (
                <View key={ri} style={styles.calendarRow}>
                  {row.map((day, ci) => {
                    if (!day) return <View key={ci} style={styles.calendarFullCell} />;
                    const dateKey = makeDateKey(calYear, calMonth, day);
                    const entry = allEntries.find((e) => e.dateKey === dateKey);
                    const isToday = dateKey === getTodayKey();
                    return (
                      <View key={ci} style={[styles.calendarFullCell, ci < 6 && styles.calendarFullCellBorderRight, ri < calRows.length - 1 && styles.calendarFullCellBorderBottom]}>
                        {entry?.imageUri ? (
                          <Image source={{ uri: entry.imageUri }} style={styles.calendarCellThumb} />
                        ) : null}
                        <View style={[styles.calendarCellDateBadge, isToday && styles.calendarCellDateBadgeToday]}>
                          <Text style={[styles.calendarCellDateNum, isToday && styles.calendarCellDateNumToday]}>{day}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Codi Book — Grid */}
        {activeTab === 'codebook' && codiView === 'grid' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.screenContainer}>
              <Text style={styles.screenTitle}>Codi Book</Text>
            </View>
            <View style={styles.codebookGrid}>
              {CODI_BOOK_SAMPLES.map((sample, i) => (
                <Pressable
                  key={i}
                  style={({ pressed }) => [styles.codebookCard, pressed && styles.outfitSlotPressed]}
                  onPress={() => { setSelectedCodiIndex(i); setCodiTitle(sample.title); setCodiView('detail'); }}
                >
                  <View style={styles.codebookCardEmpty}>
                    <Ionicons name="shirt-outline" size={28} color="#DDDDDD" />
                  </View>
                  <Text style={styles.codebookCardTitle} numberOfLines={1}>{sample.title}</Text>
                  <Text style={styles.codebookCardDate}>최근 : {sample.date}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}

        {/* Codi Book — Detail (readonly) */}
        {activeTab === 'codebook' && codiView === 'detail' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.screenContainer, { paddingBottom: 40 }]}>
            {/* Header: back icon + 저장 */}
            <View style={styles.codiDetailHeader}>
              <Pressable
                hitSlop={8}
                style={({ pressed }) => [pressed && styles.outfitSlotPressed]}
                onPress={() => { setCodiView('grid'); setSelectedCodiIndex(null); setCodiItems({}); setCodiTitle(''); setCodiTags([]); setIsEditMode(false); }}
              >
                <Ionicons name="chevron-back" size={24} color="#222" />
              </Pressable>
              <Pressable hitSlop={8} style={({ pressed }) => [pressed && styles.outfitSlotPressed]}>
                <Text style={styles.codiSaveText}>저장</Text>
              </Pressable>
            </View>

            {/* Main title */}
            {codiTitle ? (
              <Text style={styles.codiViewTitle}>{codiTitle}</Text>
            ) : (
              <Text style={styles.codiViewTitleEmpty}>제목 없음</Text>
            )}

            {/* Representative image — composed from added items */}
            <View style={styles.codiPreviewImageWrap}>
              {(() => {
                const picked = ['아우터', '상의', '하의', '신발', '가방', '악세사리']
                  .map((k) => codiItems[k])
                  .filter(Boolean) as ClosetItem[];
                if (picked.length === 0) {
                  return <View style={styles.codiPreviewImageEmpty} />;
                }
                return (
                  <View style={styles.codiPreviewCollage}>
                    {picked.map((it) => (
                      <View key={it.id} style={[styles.codiPreviewCollageCell, { backgroundColor: it.color }]} />
                    ))}
                  </View>
                );
              })()}
            </View>

            {/* Tags */}
            <View style={[styles.codiPreviewTagRow, { marginBottom: 24 }]}>
              {codiTags.map((tag) => (
                <Pressable
                  key={tag}
                  style={styles.codiTagChip}
                  onPress={() => setCodiTags((prev) => prev.filter((t) => t !== tag))}
                >
                  <Text style={styles.codiTagChipText}>#{tag}</Text>
                  <Ionicons name="close" size={11} color="#888" />
                </Pressable>
              ))}
              <View style={[styles.codiTagChip, { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EBEBEB' }]}>
                <TextInput
                  style={[styles.codiTagInput, { padding: 0, minWidth: 80 }]}
                  placeholder="태그 추가"
                  placeholderTextColor="#CCCCCC"
                  value={codiTagInput}
                  onChangeText={setCodiTagInput}
                  onSubmitEditing={() => {
                    const t = codiTagInput.trim();
                    if (t && !codiTags.includes(t)) setCodiTags((prev) => [...prev, t]);
                    setCodiTagInput('');
                  }}
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Item list header */}
            <View style={styles.codiSectionHeaderRow}>
              <Text style={styles.codiSectionHeaderLabel}>아이템</Text>
              <Pressable
                style={({ pressed }) => [styles.codiEditBtn, isEditMode && { backgroundColor: '#111111' }, pressed && styles.outfitSlotPressed]}
                onPress={() => setIsEditMode((v) => !v)}
              >
                {isEditMode ? (
                  <Text style={[styles.codiEditBtnText, { color: '#FFFFFF' }]}>완료</Text>
                ) : (
                  <>
                    <Ionicons name="pencil-outline" size={12} color="#888" />
                    <Text style={styles.codiEditBtnText}>수정</Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* Horizontal stack item list */}
            <View style={styles.codiItemStackList}>
              {[
                { key: '아우터', icon: 'snow-outline' },
                { key: '상의', icon: 'shirt-outline' },
                { key: '하의', icon: 'filter-outline' },
                { key: '신발', icon: 'footsteps-outline' },
                { key: '가방', icon: 'bag-handle-outline' },
                { key: '악세사리', icon: 'diamond-outline' },
              ].map(({ key, icon }, idx, arr) => {
                const item = codiItems[key];
                return (
                  <View key={key} style={[styles.codiItemStackRow, idx < arr.length - 1 && styles.codiItemStackRowBorder]}>
                    <View style={styles.codiItemStackLeft}>
                      <Text style={styles.codiItemStackName}>{key}</Text>
                      <Text style={styles.codiItemStackSub}>{item ? item.name : '추가되지 않음'}</Text>
                    </View>
                    <Pressable
                      style={({ pressed }) => [styles.codiItemStackThumb, pressed && styles.outfitSlotPressed]}
                      onPress={() => { if (isEditMode) { setSheetCategory(key); setSheetView('item'); setSheetVisible(true); Animated.parallel([Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 4 }), Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true })]).start(); } }}
                      disabled={!isEditMode}
                    >
                      {item ? (
                        <View style={[styles.codiItemStackThumbImage, { backgroundColor: item.color }]} />
                      ) : (
                        <Ionicons name={icon as any} size={18} color="#DDDDDD" />
                      )}
                      {isEditMode && (
                        <View style={styles.codiThumbEditOverlay}>
                          <Ionicons name="pencil" size={11} color="#FFFFFF" />
                        </View>
                      )}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}

        {activeTab === 'favorites' && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.screenContainer}>
              <Text style={styles.screenTitle}>Closet</Text>
            </View>
            {['아우터', '상의', '하의', '가방', '악세사리'].map((category) => (
              <View key={category} style={styles.closetSection}>
                <Text style={styles.closetCategoryLabel}>{category}</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.closetRow}
                >
                  <Pressable style={({ pressed }) => [styles.closetAddCard, pressed && styles.outfitSlotPressed]}>
                    <Ionicons name="add" size={24} color="#C0C0C0" />
                  </Pressable>
                </ScrollView>
              </View>
            ))}
          </ScrollView>
        )}

        {activeTab === 'mypage' && (
          <ScrollView contentContainerStyle={[styles.screenContainer, { paddingBottom: 40 }]} showsVerticalScrollIndicator={false}>
            <Text style={styles.screenTitle}>Mypage</Text>
            <View style={styles.profileCard}>
              <View style={styles.profileAvatar}>
                <Ionicons name="person" size={36} color="#BBBBBB" />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>사용자</Text>
                <Text style={styles.profileSub}>프로필을 편집해보세요</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
            </View>
            {['알림 설정', '앱 정보', '로그아웃'].map((item) => (
              <Pressable key={item} style={({ pressed }) => [styles.menuItem, pressed && styles.outfitSlotPressed]}>
                <Text style={styles.menuItemText}>{item}</Text>
                <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
              </Pressable>
            ))}
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      <View style={styles.tabBar}>
        <Pressable style={styles.tabItem} onPress={() => setActiveTab('home')}>
          <Image source={require('./assets/home.png')} style={[styles.tabHomeIcon, { opacity: activeTab === 'home' ? 1 : 0.35 }]} />
        </Pressable>
        <Pressable style={styles.tabItem} onPress={() => { setActiveTab('codebook'); setSelectedCodiIndex(null); setCodiView('grid'); }}>
          <Image source={require('./assets/book.png')} style={[styles.tabHomeIcon, { opacity: activeTab === 'codebook' ? 1 : 0.35 }]} />
        </Pressable>
        <View style={styles.tabItem}>
          <Pressable style={({ pressed }) => [styles.tabAddBtn, pressed && { opacity: 0.8 }]} onPress={openSheet}>
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </Pressable>
        </View>
        <Pressable style={styles.tabItem} onPress={() => setActiveTab('favorites')}>
          <Image source={require('./assets/category.png')} style={[styles.tabHomeIcon, { opacity: activeTab === 'favorites' ? 1 : 0.35 }]} />
        </Pressable>
        <Pressable style={styles.tabItem} onPress={() => setActiveTab('mypage')}>
          <Image source={require('./assets/user.png')} style={[styles.tabHomeIcon, { opacity: activeTab === 'mypage' ? 1 : 0.35 }]} />
        </Pressable>
      </View>
      </View>

      <Modal visible={sheetVisible} transparent animationType="none" onRequestClose={closeSheet}>
        <View style={styles.sheetModalRoot}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.sheetBackdrop, { opacity: backdropAnim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
          </Animated.View>
          <Animated.View style={[styles.sheetContainer, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.sheetHandle} />

            {sheetView === 'main' ? (
              <>
                <Text style={styles.sheetTitle}>추가하기</Text>
                <Pressable
                  style={({ pressed }) => [styles.sheetItem, pressed && styles.outfitSlotPressed]}
                  onPress={pickImage}
                >
                  <View style={styles.sheetItemLeft}>
                    <View style={[styles.sheetItemIcon, { backgroundColor: '#F0F0F0' }]}>
                      <Ionicons name="shirt-outline" size={18} color="#555" />
                    </View>
                    <Text style={styles.sheetItemText}>코디 추가</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#C0C0C0" />
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.sheetItem, { borderBottomWidth: 0 }, pressed && styles.outfitSlotPressed]}
                  onPress={() => setSheetView('item')}
                >
                  <View style={styles.sheetItemLeft}>
                    <View style={[styles.sheetItemIcon, { backgroundColor: '#F0F0F0' }]}>
                      <Ionicons name="add-circle-outline" size={18} color="#555" />
                    </View>
                    <Text style={styles.sheetItemText}>아이템 추가</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#C0C0C0" />
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.sheetBackRow}>
                  <Pressable
                    style={({ pressed }) => [styles.sheetBackBtn, pressed && styles.outfitSlotPressed]}
                    onPress={() => sheetCategory ? closeSheet() : setSheetView('main')}
                  >
                    <Ionicons name="chevron-back" size={18} color="#555" />
                    <Text style={styles.sheetBackText}>뒤로</Text>
                  </Pressable>
                </View>
                <Text style={styles.sheetTitle}>{sheetCategory ? `${sheetCategory} 선택` : '아이템 추가'}</Text>
                <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                  {(sheetCategory ? [sheetCategory] : ['아우터', '상의', '하의', '신발', '가방', '악세사리']).map((category) => (
                    <View key={category} style={styles.sheetCategoryBlock}>
                      <Text style={styles.sheetCategoryLabel}>{category}</Text>
                      <View style={styles.sheetItemGrid}>
                        {(CLOSET_ITEMS[category] ?? []).map((item) => (
                          <Pressable
                            key={item.id}
                            style={({ pressed }) => [styles.sheetItemCard, pressed && styles.outfitSlotPressed]}
                            onPress={() => {
                              setCodiItems((prev) => ({ ...prev, [category]: item }));
                              closeSheet();
                            }}
                          >
                            <View style={[styles.sheetItemSwatch, { backgroundColor: item.color }]} />
                            <Text style={styles.sheetItemCardName} numberOfLines={1}>{item.name}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* 기등록 아이템 선택 모달 */}
      <Modal
        visible={pickerCategory !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerCategory(null)}
      >
        <View style={styles.sheetModalRoot}>
          <Pressable style={[StyleSheet.absoluteFill, styles.sheetBackdrop]} onPress={() => setPickerCategory(null)} />
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{pickerCategory} 선택</Text>
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {pickerCategory && codiItems[pickerCategory] && (
                <Pressable
                  style={({ pressed }) => [styles.pickerItemRow, pressed && styles.outfitSlotPressed]}
                  onPress={() => {
                    setCodiItems((prev) => ({ ...prev, [pickerCategory]: null }));
                    setPickerCategory(null);
                  }}
                >
                  <View style={[styles.pickerItemSwatch, { backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="close" size={16} color="#999" />
                  </View>
                  <Text style={[styles.pickerItemName, { color: '#999' }]}>선택 해제</Text>
                </Pressable>
              )}
              {pickerCategory && (CLOSET_ITEMS[pickerCategory] ?? []).map((item) => {
                const selected = codiItems[pickerCategory]?.id === item.id;
                return (
                  <Pressable
                    key={item.id}
                    style={({ pressed }) => [styles.pickerItemRow, pressed && styles.outfitSlotPressed]}
                    onPress={() => {
                      setCodiItems((prev) => ({ ...prev, [pickerCategory]: item }));
                      setPickerCategory(null);
                    }}
                  >
                    <View style={[styles.pickerItemSwatch, { backgroundColor: item.color }]} />
                    <Text style={styles.pickerItemName}>{item.name}</Text>
                    {selected && <Ionicons name="checkmark-circle" size={20} color="#111111" />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  appShell: { flex: 1, width: '100%', maxWidth: 430, alignSelf: 'center' },
  content: { paddingTop: 20, paddingBottom: 40 },
  mobileFrame: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    gap: 14,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingHorizontal: 8,
  },
  tabItem: { flex: 1, height: 64, alignItems: 'center', justifyContent: 'center' },
  tabHomeIcon: { width: 22, height: 22, resizeMode: 'contain' },
  tabAddBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Date header
  topHeader: {
    paddingTop: 0,
    paddingBottom: 4,
    gap: 20,
  },
  topTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 4,
    paddingTop: 6,
    paddingRight: 2,
  },
  calendarIconBtn: {
    padding: 4,
  },
  topTitle: {
    color: '#171717',
    fontSize: 28,
    fontFamily: 'CloudsofaNamgim',
  },
  topDeco: {
    fontSize: 10,
    color: '#D4CECC',
    marginBottom: 4,
  },

  // Week strip
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 2,
  },
  weekItem: {
    alignItems: 'center',
    minWidth: 28,
    gap: 5,
    paddingBottom: 6,
  },
  weekLabel: {
    color: '#CACACA',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    fontFamily: 'Pretendard',
  },
  weekLabelActive: {
    color: '#111111',
    fontWeight: '700',
    fontFamily: 'Pretendard',
  },
  weekDay: {
    color: '#C4C4C4',
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Pretendard',
  },
  weekDayActive: {
    color: '#111111',
    fontWeight: '800',
    fontFamily: 'Pretendard',
  },
  todayUnderline: {
    position: 'absolute',
    bottom: 0,
    width: 28,
    height: 2.5,
    borderRadius: 999,
    backgroundColor: '#111111',
  },

  // Cards
  section: { gap: 10 },

  // Weather card — ~12% more compact
  weatherCard: {
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherLeft: { flex: 1, justifyContent: 'center', gap: 5 },
  weatherDivider: {
    width: 0.5,
    alignSelf: 'stretch',
    backgroundColor: '#EBEBEB',
    marginHorizontal: 18,
  },
  weatherRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  weatherTimeSlot: { alignItems: 'center', gap: 7 },
  weatherTimeLabel: { color: '#6B7280', fontSize: 11, fontWeight: '600', fontFamily: 'Pretendard' },
  weatherTimeIcon: { width: 36, height: 36, resizeMode: 'contain' },
  weatherBigTemp: { color: '#111111', fontSize: 46, lineHeight: 50, fontWeight: '600', fontFamily: 'Pretendard' },
  weatherLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  weatherLocation: { color: '#6B7280', fontSize: 11, fontWeight: '600', fontFamily: 'Pretendard' },
  weatherRange: { color: '#8E8E93', fontSize: 12, fontWeight: '500', fontFamily: 'Pretendard' },

  // Outfit card
  outfitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  outfitCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  outfitCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    letterSpacing: 0.2,
    fontFamily: 'Pretendard',
  },
  outfitAddPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#111111',
  },
  outfitAddPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    fontFamily: 'Pretendard',
  },
  outfitEmptyBody: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  outfitEmptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F8F7F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  outfitEmptyIconText: {
    fontSize: 24,
  },
  outfitEmptyText: {
    fontSize: 13,
    color: '#AAAAAA',
    fontWeight: '500',
    fontFamily: 'Pretendard',
  },
  outfitEmptyDeco: {
    fontSize: 10,
    color: '#D8D4D0',
    letterSpacing: 4,
    marginTop: 2,
    fontFamily: 'Pretendard',
  },

  outfitSlotPressed: { opacity: 0.6 },

  // Other screens
  screenContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  screenTitle: {
    fontSize: 28,
    fontFamily: 'CloudsofaNamgim',
    color: '#171717',
    marginBottom: 20,
    paddingLeft: 4,
    paddingTop: 6,
  },

  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  calendarMonthLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#AAAAAA',
    fontFamily: 'Pretendard',
    paddingBottom: 10,
    paddingRight: 2,
  },
  calendarDayHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  calendarDayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: '#BBBBBB',
    paddingVertical: 7,
    fontFamily: 'Pretendard',
  },
  calendarFullGrid: {
    flex: 1,
  },
  calendarRow: {
    flex: 1,
    flexDirection: 'row',
  },
  calendarFullCell: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  calendarFullCellBorderRight: {
    borderRightWidth: 1,
    borderRightColor: '#F5F5F5',
  },
  calendarFullCellBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  calendarCellThumb: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    resizeMode: 'cover',
    opacity: 0.7,
  },
  calendarCellDateBadge: {
    position: 'absolute',
    top: 5,
    left: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarCellDateBadgeToday: {
    backgroundColor: '#111111',
  },
  calendarCellDateNum: {
    fontSize: 12,
    color: '#444444',
    fontWeight: '500',
    fontFamily: 'Pretendard',
  },
  calendarCellDateNumToday: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  codebookGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  codebookCard: {
    width: '47%',
    borderRadius: 20,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  codebookCardEmpty: {
    aspectRatio: 3 / 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  codebookCardTitle: {
    fontSize: 15,
    color: '#222222',
    fontFamily: 'CloudsofaNamgim',
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  codebookCardDate: {
    fontSize: 11,
    color: '#BBBBBB',
    fontFamily: 'Pretendard',
    fontWeight: '500',
    paddingHorizontal: 12,
    paddingTop: 2,
    paddingBottom: 10,
  },
  codiDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  codiSaveText: {
    fontSize: 15,
    color: '#111111',
    fontFamily: 'Pretendard',
    fontWeight: '600',
  },
  codiEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F3F3F3',
  },
  codiEditBtnText: {
    fontSize: 12,
    color: '#888888',
    fontFamily: 'Pretendard',
    fontWeight: '500',
  },
  codiViewTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111111',
    fontFamily: 'Pretendard',
    marginBottom: 20,
    paddingLeft: 2,
  },
  codiViewTitleEmpty: {
    fontSize: 30,
    fontWeight: '700',
    color: '#CFCFCF',
    fontFamily: 'Pretendard',
    marginBottom: 20,
    paddingLeft: 2,
  },
  codiPreviewHint: {
    fontSize: 13,
    color: '#C4C4C4',
    fontFamily: 'Pretendard',
    fontWeight: '500',
  },
  codiSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  codiSectionHeaderLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888888',
    fontFamily: 'Pretendard',
  },
  codiPreviewImageWrap: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  codiPreviewImageEmpty: {
    height: 300,
  },
  codiPreviewCollage: {
    height: 300,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  codiPreviewCollageCell: {
    width: '50%',
    flexGrow: 1,
    minHeight: 100,
  },
  codiItemStackList: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  codiItemStackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  codiItemStackRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  codiItemStackLeft: {
    gap: 3,
  },
  codiItemStackName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Pretendard',
  },
  codiItemStackSub: {
    fontSize: 12,
    color: '#AAAAAA',
    fontFamily: 'Pretendard',
    fontWeight: '400',
  },
  codiItemStackThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  codiItemStackThumbImage: {
    width: 44,
    height: 44,
    resizeMode: 'cover',
  },
  codiThumbEditOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codiPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Pretendard',
  },
  codiPreviewTitleEmpty: {
    fontSize: 14,
    color: '#CCCCCC',
    fontFamily: 'Pretendard',
  },
  codiPreviewTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  codiPreviewSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  codiDetailBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  codiDetailBackText: {
    fontSize: 14,
    color: '#333333',
    fontFamily: 'Pretendard',
    fontWeight: '500',
  },
  codiBuilderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  codiBuilderSlot: {
    width: '31%',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  codiBuilderSlotEmpty: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  codiBuilderSlotImage: {
    width: '100%',
    aspectRatio: 1,
    resizeMode: 'cover',
  },
  codiBuilderSlotLabel: {
    fontSize: 11,
    color: '#888888',
    fontFamily: 'Pretendard',
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 7,
  },
  codiTitleInput: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Pretendard',
    color: '#111111',
    borderBottomWidth: 1.5,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 12,
    marginBottom: 20,
  },
  codiTagSection: {
    marginBottom: 20,
    gap: 10,
  },
  codiTagChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  codiTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F3F3F3',
  },
  codiTagChipText: {
    fontSize: 12,
    color: '#555555',
    fontFamily: 'Pretendard',
    fontWeight: '500',
  },
  codiTagInputRow: {
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  codiTagInput: {
    fontSize: 13,
    color: '#333333',
    fontFamily: 'Pretendard',
  },
  codiDetailAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#111111',
    borderRadius: 16,
    paddingVertical: 14,
  },
  codiDetailAddBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Pretendard',
    fontWeight: '600',
  },
  closetSection: { marginBottom: 28 },
  closetCategoryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
    paddingHorizontal: 20,
    marginBottom: 12,
    fontFamily: 'Pretendard',
  },
  closetRow: { paddingHorizontal: 20, gap: 12 },
  closetAddCard: {
    width: 110,
    height: 140,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    padding: 16,
    gap: 14,
    marginBottom: 24,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 16, fontWeight: '700', color: '#111111', fontFamily: 'Pretendard' },
  profileSub: { fontSize: 13, color: '#AAAAAA', fontFamily: 'Pretendard' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F3F3',
  },
  menuItemText: { fontSize: 15, fontWeight: '500', color: '#222222', fontFamily: 'Pretendard' },

  // Bottom sheet
  sheetModalRoot: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  sheetBackdrop: { backgroundColor: 'rgba(0,0,0,0.55)' },
  sheetContainer: {
    width: '100%',
    maxWidth: 430,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#111111', marginBottom: 12, fontFamily: 'Pretendard' },
  sheetCategoryBlock: {
    marginBottom: 18,
  },
  sheetCategoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888888',
    fontFamily: 'Pretendard',
    marginBottom: 10,
  },
  sheetItemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sheetItemCard: {
    width: '30%',
    gap: 6,
  },
  sheetItemSwatch: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
  },
  sheetItemCardName: {
    fontSize: 11,
    color: '#555555',
    fontFamily: 'Pretendard',
    fontWeight: '500',
    textAlign: 'center',
  },
  pickerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  pickerItemSwatch: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
  },
  pickerItemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#222222',
    fontFamily: 'Pretendard',
  },
  sheetItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBackRow: { marginBottom: 4 },
  sheetBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4, alignSelf: 'flex-start' },
  sheetBackText: { fontSize: 14, color: '#555555', fontFamily: 'Pretendard', fontWeight: '500' },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  sheetItemText: { fontSize: 15, fontWeight: '500', color: '#222222', fontFamily: 'Pretendard' },
});
