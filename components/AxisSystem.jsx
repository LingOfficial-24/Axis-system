"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Star, Orbit, Clock, CalendarDays, BarChart3, Plus, Trash2, X,
  Play, Pause, RotateCcw, Check, AlertTriangle, Settings2,
  ChevronRight, ChevronUp, ChevronDown, Coffee, Sparkles, Flame, Ban, PenLine,
  Crown, Trophy, Medal, Globe, User, LogOut, Search, Copy
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// Khởi tạo Supabase an toàn với Fallback
const supabaseUrl = "https://ysvwudazegxcftpdqnfm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzdnd1ZGF6ZWd4Y2Z0cGRxbmZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNjIyNDUsImV4cCI6MjEwMjczODI0NX0.kdiuncayUXUHRLSWYO7F1jDnxLuPa26zlpr2t4rhz7M";

const supabase = createClient(supabaseUrl, supabaseKey);

// ---------------------------------------------------------------------------
// Constants & seed data
// ---------------------------------------------------------------------------

const HOURS = Array.from({ length: 24 }, (_, i) => i); // 00:00 - 23:00, full day

const COLOR_SWATCHES = [
  { name: "sky",     dot: "bg-sky-400",     ring: "ring-sky-400",     text: "text-sky-300",     grad: "from-sky-500 to-sky-300",     bar: "bg-sky-400",     border: "border-sky-200" },
  { name: "orange",  dot: "bg-orange-400",  ring: "ring-orange-400",  text: "text-orange-300",  grad: "from-orange-500 to-orange-300", bar: "bg-orange-400", border: "border-orange-200" },
  { name: "violet",  dot: "bg-violet-400",  ring: "ring-violet-400",  text: "text-violet-300",  grad: "from-violet-500 to-violet-300", bar: "bg-violet-400", border: "border-violet-200" },
  { name: "teal",    dot: "bg-teal-400",    ring: "ring-teal-400",    text: "text-teal-300",    grad: "from-teal-500 to-teal-300",    bar: "bg-teal-400",   border: "border-teal-200" },
  { name: "rose",    dot: "bg-rose-400",    ring: "ring-rose-400",    text: "text-rose-300",    grad: "from-rose-500 to-rose-300",    bar: "bg-rose-400",   border: "border-rose-200" },
  { name: "amber",   dot: "bg-amber-400",   ring: "ring-amber-400",   text: "text-amber-300",   grad: "from-amber-500 to-amber-300",  bar: "bg-amber-400",  border: "border-amber-200" },
  { name: "emerald", dot: "bg-emerald-400", ring: "ring-emerald-400", text: "text-emerald-300", grad: "from-emerald-500 to-emerald-300", bar: "bg-emerald-400", border: "border-emerald-200" },
  { name: "indigo",  dot: "bg-indigo-400",  ring: "ring-indigo-400",  text: "text-indigo-300",  grad: "from-indigo-500 to-indigo-300", bar: "bg-indigo-400", border: "border-indigo-200" },
];

const swatch = (name) => COLOR_SWATCHES.find((c) => c.name === name) || COLOR_SWATCHES[0];

const uid = () => Math.random().toString(36).slice(2, 10);

const DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

// No demo/example content is pre-loaded — every person defines their own
// Sao Chủ and Sao Con from a blank slate on first use.

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function fmtMin(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h <= 0) return `${m}p`;
  return m === 0 ? `${h}g` : `${h}g${m}p`;
}

function fmtClock(hour) {
  // Vietnamese convention: count the day 1h–24h, not 0h–23h — each mark is
  // the hour it completes, so the very last mark correctly reads "24:00"
  // instead of stranding it up at the top next to "0:00".
  return `${String(hour + 1).padStart(2, "0")}:00`;
}

// ---- Continuous time helpers (second-level precision) ---------------------

const DAY_START_SEC = HOURS[0] * 3600; // 00:00:00 — full day
const DEFAULT_DAY_END_SEC = 23 * 3600; // 23:00:00 — adjustable, dragged by the person
const HARD_MAX_SEC = 24 * 3600 - 60; // 23:59:00, native <input type=time> ceiling
const PX_PER_HOUR = 72;

function pad2(n) { return String(n).padStart(2, "0"); }

function secToLabel(sec) {
  const h = Math.floor(sec / 3600) % 24;
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return s === 0 ? `${pad2(h)}:${pad2(m)}` : `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

function nowSecOfDay() {
  const d = new Date();
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}

// ---- Calendar day helpers (for real persistence & streaks) ---------------

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function dateStrDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// "2026-08-20" -> "20/08/2026" — a plain numeric label that reads the same
// regardless of the active language, no per-locale month names to translate.
function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function parseDateStr(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function daysBetweenStr(a, b) {
  return Math.round((parseDateStr(b) - parseDateStr(a)) / 86400000);
}
function fmtDateShort(str) {
  const [y, m, d] = str.split("-");
  return `${d}/${m}`;
}

// ---- Overall streak: a day only counts once EVERY Sao Con hit its own
// daily target — one missed pillar and the whole day (and the streak) fails.

function dailyPillarStatus(pillars, logs, date) {
  const minutesByPillar = {};
  logs.forEach((l) => {
    if (l.pillarId === "noise" || l.date !== date) return;
    minutesByPillar[l.pillarId] = (minutesByPillar[l.pillarId] || 0) + l.minutes;
  });
  return pillars.map((p) => ({
    pillar: p,
    minutes: minutesByPillar[p.id] || 0,
    met: (minutesByPillar[p.id] || 0) >= p.target,
  }));
}

function dayFullyComplete(pillars, logs, date) {
  return pillars.length > 0 && dailyPillarStatus(pillars, logs, date).every((s) => s.met);
}

// Every run of consecutive calendar days where ALL pillars were completed —
// chronological, oldest first.
function computeOverallStreakRuns(pillars, logs) {
  if (!pillars.length) return [];
  const candidateDates = new Set([todayStr()]);
  logs.forEach((l) => { if (l.pillarId !== "noise") candidateDates.add(l.date); });
  const metDates = [...candidateDates].filter((d) => dayFullyComplete(pillars, logs, d)).sort();
  const runs = [];
  let start = null, prev = null;
  metDates.forEach((d) => {
    if (!(prev && daysBetweenStr(prev, d) === 1)) {
      if (start) runs.push({ start, end: prev, length: daysBetweenStr(start, prev) + 1 });
      start = d;
    }
    prev = d;
  });
  if (start) runs.push({ start, end: prev, length: daysBetweenStr(start, prev) + 1 });
  return runs;
}

// The streak is only "alive" if its last completed day was today or
// yesterday — a day in progress doesn't break it, but a real gap resets it.
function currentStreakFromRuns(runs) {
  if (!runs.length) return 0;
  const last = runs[runs.length - 1];
  return daysBetweenStr(last.end, todayStr()) <= 1 ? last.length : 0;
}

// Longest runs ever achieved, longest first — the axis's personal records.
// Takes the runs already computed by computeOverallStreakRuns so callers that
// already have them (memoized) don't pay for a second full pass.
function sortStreakRunsByLength(runs) {
  return [...runs].sort((a, b) => b.length - a.length);
}

// ---- Trophy cabinet --------------------------------------------------
// A run earns exactly one cup — the hardest tier its length reaches.
const TROPHY_TIERS = [
  { id: "year",  min: 365, labelKey: "trophy_year",  icon: Crown,  size: 72,
    badge: "bg-gradient-to-br from-yellow-200 via-amber-300 to-orange-400",
    ring: "ring-amber-200/70", iconColor: "text-amber-900", glow: true },
  { id: "month", min: 30,  labelKey: "trophy_month", icon: Trophy, size: 60,
    badge: "bg-gradient-to-br from-slate-100 via-sky-200 to-sky-400",
    ring: "ring-sky-200/60", iconColor: "text-slate-900", glow: false },
  { id: "week",  min: 7,   labelKey: "trophy_week",  icon: Medal,  size: 50,
    badge: "bg-gradient-to-br from-amber-700 via-amber-500 to-amber-300",
    ring: "ring-amber-500/50", iconColor: "text-amber-950", glow: false },
];

function classifyTrophy(length) {
  return TROPHY_TIERS.find((t) => length >= t.min) || null;
}

// Takes the runs already computed by computeOverallStreakRuns.
function computeOverallTrophies(runs) {
  return runs
    .map((r) => ({ ...r, trophy: classifyTrophy(r.length) }))
    .filter((r) => r.trophy);
}

// ---------------------------------------------------------------------------
// Persistence layer
// ---------------------------------------------------------------------------
// Life-data (saoChu/pillars/logs/blocks) is saved per PROFILE — "guest" when
// ---------------------------------------------------------------------------
// State persistence
// ---------------------------------------------------------------------------
// Guests (not logged in) get a device-local session via localStorage — no
// account needed, but data doesn't follow them to another device.
// Logged-in accounts are backed by Supabase: real auth (hashed passwords,
// managed by Supabase) plus a `user_state` table (one row per user, RLS
// restricts each row to its own owner) so data syncs across devices.

const GUEST_KEY = "axis-system-state:guest";
const LANG_KEY = "axis-lang";

async function loadState(userId) {
  if (!userId) {
    try {
      const raw = localStorage.getItem(GUEST_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  try {
    const { data, error } = await supabase
      .from("user_state")
      .select("state")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return data.state;
  } catch (e) { return null; }
}

async function saveState(userId, state) {
  if (!userId) {
    try { localStorage.setItem(GUEST_KEY, JSON.stringify(state)); } catch (e) {}
    return;
  }
  try {
    await supabase.from("user_state").upsert({
      user_id: userId, state, updated_at: new Date().toISOString(),
    });
  } catch (e) {
    // best-effort — a failed save shouldn't interrupt the session
  }
}

// ---------------------------------------------------------------------------
// Language / i18n
// ---------------------------------------------------------------------------

const LANGUAGES = [
  { code: "vi", name: "Vietnamese",   native: "Tiếng Việt",       flag: "🇻🇳" },
  { code: "en", name: "English",      native: "English",          flag: "🇬🇧" },
  { code: "fr", name: "French",       native: "Français",         flag: "🇫🇷" },
  { code: "ja", name: "Japanese",     native: "日本語",             flag: "🇯🇵" },
  { code: "zh", name: "Chinese",      native: "中文",               flag: "🇨🇳" },
  { code: "ru", name: "Russian",      native: "Русский",          flag: "🇷🇺" },
  { code: "th", name: "Thai",         native: "ภาษาไทย",           flag: "🇹🇭" },
];

// All 7 languages here are fully translated — no fallback-to-English cases
// left in the picker, so every entry the person can select is complete.
const TRANSLATIONS = {
  vi: {
    nav_dashboard: "Trục Sống", nav_timeboxing: "Lịch Ngày", nav_pillars: "Sao Con", nav_analytics: "Thành Tích",
    header_tagline: "Hệ Thống Trục Sống",
    onboarding_title: "Chưa có Sao Chủ nào", onboarding_desc: "Trục sống của bạn là của riêng bạn. Hãy tự đặt Sao Chủ — mục tiêu cốt lõi hiện tại của bạn — để bắt đầu.", onboarding_cta: "Thiết lập Sao Chủ của tôi",
    saochu_setup_title: "Thiết lập Sao Chủ của bạn", saochu_edit_title: "Sao Chủ (Trục Sống Chính)",
    field_name: "Tên", field_desc: "Mô tả", btn_save: "Lưu",
    dash_streak_prefix: "Chuỗi Trục Sống", dash_streak_hint: "cần hoàn thành mọi Sao Con trong ngày để giữ chuỗi",
    dash_empty_title: "Trục sống của bạn còn trống", dash_add_first: "Thêm Sao Con đầu tiên",
    dash_empty_body_1: "Tự chọn những Sao Con — hoạt động cụ thể — sẽ nuôi dưỡng", dash_empty_body_2: "mỗi ngày. Không có gợi ý dựng sẵn, chỉ có lựa chọn của bạn.",
    btn_schedule_today: "Lên lịch hôm nay", btn_manage_pillars: "Quản lý Sao Con", card_done: "Đã đạt",
    btn_add_block: "Thêm khung",
    btn_add_pillar: "Thêm sao", pillars_empty: "Chưa có Sao Con nào.", pillars_sub: "Các Sao Con đang nuôi dưỡng trục sống của bạn.",
    no_desc: "Không có mô tả", pillar_target_prefix: "Mục tiêu", pillar_today_prefix: "Hôm nay",
    analytics_time_title: "Phân bổ thời gian tuần này", analytics_time_sub: "7 ngày gần nhất, tính theo Sao Con",
    achv_title: "Thành Tích", achv_trophy_title: "Tủ Cúp", achv_history_title: "Lịch sử chuỗi", noise_today_title: "Nhiễu Ngân Hà hôm nay",
    achv_current_streak_label: "Chuỗi Trục Sống hiện tại", achv_days_suffix: "ngày", achv_best_ever_prefix: "Kỷ lục cao nhất từng đạt:",
    achv_rule_1: "Một ngày chỉ được tính khi", achv_rule_all: "tất cả", achv_rule_2: "Sao Con đều đạt mục tiêu riêng — thiếu một cái, cả ngày và cả chuỗi coi như hỏng.",
    achv_trophy_sub: "7 ngày liên tục → Cúp Tuần · 30 ngày → Cúp Tháng · 365 ngày → Cúp Năm",
    achv_history_sub: "Mọi chuỗi từng đạt, xếp từ dài nhất đến ngắn nhất", achv_history_empty: "Chưa có chuỗi nào được ghi nhận.",
    trophy_empty_msg: "Chưa có cúp nào — giữ chuỗi đủ 7 ngày liên tục (hoàn thành mọi Sao Con mỗi ngày) để nhận Cúp Tuần đầu tiên.",
    noise_today_some: "chưa được phân loại vào Sao Con nào hôm nay. Xem lại lịch để định hướng lại.", noise_today_none: "Chưa có hoạt động nhiễu nào được ghi nhận hôm nay.",
    btn_cancel: "Huỷ", btn_delete: "Xoá", btn_close: "Đóng",
    tb_hint: "Không có ô giờ cố định — mỗi việc bắt đầu và kết thúc đúng thời điểm thực tế, chính xác đến từng giây. Vạch đỏ (Dây Thời Gian) chạm tới khung nào mới bật Tiêu Điểm được khung đó. Kéo vạch cam để chỉnh ngày của bạn dài tới đâu.",
    tb_empty: "Chưa có khung giờ nào. Nhấn \"Thêm khung\" và chọn giờ:phút:giây thực tế.",
    now_line_label: "Dây Thời Gian", status_not_yet: "Chưa đến", status_overdue: "Quá thời hạn", deleted_pillar_label: "(đã xoá)", noise_block_label: "Nhiễu Ngân Hà", tb_default_schedule_name: "Lịch của tôi",
    block_add_title: "Thêm khung giờ", block_edit_title: "Sửa khung giờ", field_start: "Bắt đầu", field_end: "Kết thúc", btn_now: "Bây giờ",
    duration_prefix: "Kéo dài", duration_min_note: "cần tối thiểu 30p", duration_invalid: "Chưa hợp lệ",
    noise_option_desc: "Việc phát sinh, không phục vụ Sao Con nào — dùng để nhìn ra mình đang mất bao nhiêu thời gian vào việc lạc hướng",
    err_select_pillar_or_noise: "Chọn một Sao Con hoặc đánh dấu Nhiễu Ngân Hà.", err_end_before_start: "Giờ kết thúc phải sau giờ bắt đầu.", err_min_duration: "Khung giờ phải dài tối thiểu 30 phút.",
    pillar_add_title: "Thêm Sao Con", pillar_edit_title: "Sửa Sao Con", field_target: "Mục tiêu tối thiểu / ngày (phút)", field_color: "Màu",
    err_name_required: "Tên Sao Con không được để trống.", err_target_min: "Mục tiêu tối thiểu là 30 phút/ngày.", pillar_btn_save_changes: "Lưu thay đổi",
    btn_save_as_template: "Lưu thành mẫu", btn_update_template: "Cập nhật mẫu từ hôm nay", btn_duplicate_template: "Sao chép mẫu",
    btn_delete_template: "Xoá mẫu", template_confirm_delete: "Xoá mẫu lịch này? Không ảnh hưởng tới lịch hôm nay.",
    template_modal_title_new: "Lưu lịch hôm nay thành mẫu", template_modal_title_duplicate: "Sao chép thành mẫu mới",
    template_modal_title_edit: "Sửa tên & ngày của mẫu", btn_edit_template: "Sửa tên & ngày", field_template_date: "Ngày",
    template_name_placeholder: "Ví dụ: Ngày thường, Ngày đi chơi...", err_template_name_required: "Mẫu lịch cần có tên.",
    abandon_title: "Từ bỏ Sao Con?", abandon_warning_1: "Bạn đã thực sự nỗ lực 100% với", abandon_warning_2: "chưa? Chỉ từ bỏ nếu nó không còn phục vụ Sao Chủ của bạn — đừng bỏ cuộc vì lười biếng.",
    abandon_streak_note_1: "Chuỗi Trục Sống hiện tại:", abandon_streak_note_2: "— vì chuỗi tính khi hoàn thành mọi Sao Con, bớt", abandon_streak_note_3: "sẽ đổi luôn điều kiện giữ chuỗi từ ngày mai.",
    btn_keep: "Giữ lại", btn_abandon: "Từ bỏ",
    focus_axis_prefix: "Sao Chủ:", focus_break_title: "Khoảng nghỉ giữa", focus_break_heading: "Nghỉ ngơi, làm mới RAM",
    btn_pause: "Tạm dừng", btn_resume: "Tiếp tục", btn_skip_break: "Bỏ qua nghỉ",
    focus_done_title: "Hoàn thành phiên tiêu điểm", focus_done_body_1: "Bạn vừa nuôi dưỡng", focus_done_body_2: "qua", focus_label: "Tiêu điểm", focus_this_session: "phiên này", per_day_suffix: "ngày", err_saochu_name_required: "Sao Chủ cần có tên.", saochu_hint_edit: "Chỉ nên có một Sao Chủ tại một thời điểm để tránh quá tải nhận thức.", saochu_hint_setup: "Đây là trục sống của riêng bạn — không có sẵn gợi ý, hãy tự chọn mục tiêu cốt lõi hiện tại của bạn là gì. Chỉ nên có một Sao Chủ tại một thời điểm.", trophy_year: "Cúp Năm", trophy_month: "Cúp Tháng", trophy_week: "Cúp Tuần",
    account_label: "Tài khoản", auth_login_title: "Đăng nhập", auth_register_title: "Đăng ký",
    auth_email: "Email", auth_password: "Mật khẩu", auth_login_btn: "Đăng nhập", auth_register_btn: "Đăng ký",
    auth_guest_btn: "Tiếp tục không cần tài khoản", auth_logout_btn: "Đăng xuất",
    auth_switch_to_register: "Chưa có tài khoản? Đăng ký", auth_switch_to_login: "Đã có tài khoản? Đăng nhập",
    auth_welcome: "Xin chào", auth_note: "Tài khoản của bạn được lưu an toàn trên máy chủ và đồng bộ trên mọi thiết bị.",
    auth_check_email: "Đăng ký thành công — vui lòng kiểm tra email để xác nhận tài khoản trước khi đăng nhập.",
    auth_error_mismatch: "Sai email hoặc mật khẩu.", auth_error_exists: "Email này đã đăng ký rồi.", auth_error_fields: "Nhập đủ email và mật khẩu.",
    lang_label: "Ngôn ngữ", lang_search: "Tìm ngôn ngữ của bạn...", time_hms_hint: "giờ : phút : giây", pillar_name_placeholder: "VD: Học tiếng Anh", pillar_desc_placeholder: "Hoạt động cụ thể hằng ngày",
  },
  en: {
    nav_dashboard: "Axis", nav_timeboxing: "Schedule", nav_pillars: "Guide Stars", nav_analytics: "Achievements",
    header_tagline: "Life Axis System",
    onboarding_title: "No North Star yet", onboarding_desc: "Your life axis is yours alone. Set your own North Star — your current core focus — to begin.", onboarding_cta: "Set my North Star",
    saochu_setup_title: "Set up your North Star", saochu_edit_title: "North Star (Main Life Axis)",
    field_name: "Name", field_desc: "Description", btn_save: "Save",
    dash_streak_prefix: "Life Axis Streak", dash_streak_hint: "complete every Guide Star today to keep the streak",
    dash_empty_title: "Your axis is still empty", dash_add_first: "Add your first Guide Star",
    dash_empty_body_1: "Choose the Guide Stars — concrete actions — that will feed", dash_empty_body_2: "every day. No presets, just your own choices.",
    btn_schedule_today: "Schedule today", btn_manage_pillars: "Manage Guide Stars", card_done: "Done",
    btn_add_block: "Add block",
    btn_add_pillar: "Add Guide Star", pillars_empty: "No Guide Stars yet.", pillars_sub: "The Guide Stars feeding your life axis.",
    no_desc: "No description", pillar_target_prefix: "Target", pillar_today_prefix: "Today",
    analytics_time_title: "This week's time breakdown", analytics_time_sub: "Last 7 days, by Guide Star",
    achv_title: "Achievements", achv_trophy_title: "Trophy Case", achv_history_title: "Streak history", noise_today_title: "Galaxy noise today",
    achv_current_streak_label: "Current Life Axis streak", achv_days_suffix: "days", achv_best_ever_prefix: "Best ever:",
    achv_rule_1: "A day only counts when", achv_rule_all: "every", achv_rule_2: "Guide Star hits its own target — miss one, and the whole day (and streak) fails.",
    achv_trophy_sub: "7 days straight → Week Cup · 30 days → Month Cup · 365 days → Year Cup",
    achv_history_sub: "Every streak ever reached, longest first", achv_history_empty: "No streak recorded yet.",
    trophy_empty_msg: "No trophies yet — keep a 7-day streak (every Guide Star, every day) to earn your first Week Cup.",
    noise_today_some: "not sorted into any Guide Star today. Check your schedule to refocus.", noise_today_none: "No noise activity logged today.",
    btn_cancel: "Cancel", btn_delete: "Delete", btn_close: "Close",
    tb_hint: "No fixed time slots — every task starts and ends at its real moment, down to the second. The red line (the Timeline) only unlocks Focus Mode for whichever block it's touching. Drag the orange marker to set how long your day runs.",
    tb_empty: "No blocks yet. Tap \"Add block\" and pick the real hour:minute:second.",
    now_line_label: "Timeline", status_not_yet: "Not yet", status_overdue: "Overdue", deleted_pillar_label: "(deleted)", noise_block_label: "Galaxy Noise", tb_default_schedule_name: "My schedule",
    block_add_title: "Add a block", block_edit_title: "Edit block", field_start: "Start", field_end: "End", btn_now: "Now",
    duration_prefix: "Lasts", duration_min_note: "needs at least 30m", duration_invalid: "Not valid",
    noise_option_desc: "Something that came up, not serving any Guide Star — use it to see how much time is leaking outside your axis",
    err_select_pillar_or_noise: "Choose a Guide Star or mark it as Galaxy Noise.", err_end_before_start: "End time must be after start time.", err_min_duration: "A block must be at least 30 minutes long.",
    pillar_add_title: "Add a Guide Star", pillar_edit_title: "Edit Guide Star", field_target: "Minimum target / day (minutes)", field_color: "Color",
    err_name_required: "The Guide Star needs a name.", err_target_min: "Minimum target is 30 minutes/day.", pillar_btn_save_changes: "Save changes",
    btn_save_as_template: "Save as template", btn_update_template: "Update template from today", btn_duplicate_template: "Duplicate template",
    btn_delete_template: "Delete template", template_confirm_delete: "Delete this schedule template? Today's schedule is unaffected.",
    template_modal_title_new: "Save today as a template", template_modal_title_duplicate: "Duplicate as a new template",
    template_modal_title_edit: "Edit template name & date", btn_edit_template: "Edit name & date", field_template_date: "Date",
    template_name_placeholder: "e.g. Weekday, Day off...", err_template_name_required: "The template needs a name.",
    abandon_title: "Abandon this Guide Star?", abandon_warning_1: "Have you really given 100% to", abandon_warning_2: "yet? Only abandon it if it no longer serves your North Star — don't give up out of laziness.",
    abandon_streak_note_1: "Current Life Axis streak:", abandon_streak_note_2: "— since the streak needs every Guide Star completed, dropping", abandon_streak_note_3: "changes what it takes to keep the streak starting tomorrow.",
    btn_keep: "Keep it", btn_abandon: "Abandon",
    focus_axis_prefix: "North Star:", focus_break_title: "Break in between", focus_break_heading: "Rest, clear your mental RAM",
    btn_pause: "Pause", btn_resume: "Resume", btn_skip_break: "Skip break",
    focus_done_title: "Focus session complete", focus_done_body_1: "You just fed", focus_done_body_2: "through", focus_label: "Focus", focus_this_session: "this session", per_day_suffix: "day", err_saochu_name_required: "Your North Star needs a name.", saochu_hint_edit: "Keep only one North Star at a time to avoid overload.", saochu_hint_setup: "This life axis is yours alone — no suggestions here, choose your own current core focus. Keep only one North Star at a time.", trophy_year: "Year Cup", trophy_month: "Month Cup", trophy_week: "Week Cup",
    account_label: "Account", auth_login_title: "Log in", auth_register_title: "Sign up",
    auth_email: "Email", auth_password: "Password", auth_login_btn: "Log in", auth_register_btn: "Sign up",
    auth_guest_btn: "Continue without an account", auth_logout_btn: "Log out",
    auth_switch_to_register: "No account yet? Sign up", auth_switch_to_login: "Already have an account? Log in",
    auth_welcome: "Hello", auth_note: "Your account is stored securely on the server and synced across every device.",
    auth_check_email: "Registration successful — please check your email to confirm your account before logging in.",
    auth_error_mismatch: "Wrong email or password.", auth_error_exists: "That email is already registered.", auth_error_fields: "Enter both email and password.",
    lang_label: "Language", lang_search: "Search for your language...", time_hms_hint: "hr : min : sec", pillar_name_placeholder: "e.g. Learn English", pillar_desc_placeholder: "A concrete daily activity",
  },
  fr: {
    nav_dashboard: "Axe", nav_timeboxing: "Planning", nav_pillars: "Étoiles Guides", nav_analytics: "Réussites",
    header_tagline: "Système d'Axe de Vie",
    onboarding_title: "Aucune Étoile Polaire", onboarding_desc: "Votre axe de vie n'appartient qu'à vous. Définissez votre Étoile Polaire — votre objectif central actuel — pour commencer.", onboarding_cta: "Définir mon Étoile Polaire",
    saochu_setup_title: "Configurez votre Étoile Polaire", saochu_edit_title: "Étoile Polaire (Axe Principal)",
    field_name: "Nom", field_desc: "Description", btn_save: "Enregistrer",
    dash_streak_prefix: "Série de l'Axe", dash_streak_hint: "complétez chaque Étoile Guide aujourd'hui pour garder la série",
    dash_empty_title: "Votre axe est encore vide", dash_add_first: "Ajouter votre première Étoile Guide",
    dash_empty_body_1: "Choisissez les Étoiles Guides — des actions concrètes — qui nourriront", dash_empty_body_2: "chaque jour. Aucune suggestion prédéfinie, seulement vos propres choix.",
    btn_schedule_today: "Planifier aujourd'hui", btn_manage_pillars: "Gérer les Étoiles Guides", card_done: "Atteint",
    btn_add_block: "Ajouter un créneau",
    btn_add_pillar: "Ajouter une Étoile Guide", pillars_empty: "Aucune Étoile Guide pour l'instant.", pillars_sub: "Les Étoiles Guides qui nourrissent votre axe de vie.",
    no_desc: "Aucune description", pillar_target_prefix: "Objectif", pillar_today_prefix: "Aujourd'hui",
    analytics_time_title: "Répartition du temps cette semaine", analytics_time_sub: "7 derniers jours, par Étoile Guide",
    achv_title: "Réussites", achv_trophy_title: "Vitrine des trophées", achv_history_title: "Historique des séries", noise_today_title: "Bruit galactique aujourd'hui",
    achv_current_streak_label: "Série actuelle de l'Axe de Vie", achv_days_suffix: "jours", achv_best_ever_prefix: "Record absolu :",
    achv_rule_1: "Un jour ne compte que si", achv_rule_all: "toutes les", achv_rule_2: "Étoiles Guides atteignent leur objectif — une seule manquée, et la journée (et la série) échoue.",
    achv_trophy_sub: "7 jours d'affilée → Coupe Semaine · 30 jours → Coupe Mois · 365 jours → Coupe Année",
    achv_history_sub: "Toutes les séries jamais atteintes, de la plus longue à la plus courte", achv_history_empty: "Aucune série enregistrée pour l'instant.",
    trophy_empty_msg: "Pas encore de trophée — maintenez une série de 7 jours (toutes les Étoiles Guides, chaque jour) pour obtenir votre première Coupe Semaine.",
    noise_today_some: "non classés dans une Étoile Guide aujourd'hui. Consultez votre planning pour vous recentrer.", noise_today_none: "Aucune activité de bruit enregistrée aujourd'hui.",
    btn_cancel: "Annuler", btn_delete: "Supprimer", btn_close: "Fermer",
    tb_hint: "Pas de créneaux fixes — chaque tâche commence et finit à son heure réelle, à la seconde près. La ligne rouge (la Ligne du Temps) ne débloque le Mode Focus que pour le bloc qu'elle touche. Faites glisser le repère orange pour définir jusqu'où va votre journée.",
    tb_empty: "Aucun bloc pour l'instant. Appuyez sur « Ajouter un créneau » et choisissez l'heure réelle.",
    now_line_label: "Ligne du Temps", status_not_yet: "Pas encore", status_overdue: "Dépassé", deleted_pillar_label: "(supprimé)", noise_block_label: "Bruit Galactique", tb_default_schedule_name: "Mon planning",
    block_add_title: "Ajouter un créneau", block_edit_title: "Modifier le créneau", field_start: "Début", field_end: "Fin", btn_now: "Maintenant",
    duration_prefix: "Dure", duration_min_note: "30 min minimum requis", duration_invalid: "Invalide",
    noise_option_desc: "Une activité imprévue, ne servant aucune Étoile Guide — utile pour voir combien de temps s'échappe de votre axe",
    err_select_pillar_or_noise: "Choisissez une Étoile Guide ou marquez comme Bruit Galactique.", err_end_before_start: "L'heure de fin doit être après l'heure de début.", err_min_duration: "Un créneau doit durer au moins 30 minutes.",
    pillar_add_title: "Ajouter une Étoile Guide", pillar_edit_title: "Modifier l'Étoile Guide", field_target: "Objectif minimum / jour (minutes)", field_color: "Couleur",
    err_name_required: "L'Étoile Guide doit avoir un nom.", err_target_min: "L'objectif minimum est de 30 minutes/jour.", pillar_btn_save_changes: "Enregistrer les modifications",
    btn_save_as_template: "Enregistrer comme modèle", btn_update_template: "Mettre à jour le modèle avec aujourd'hui", btn_duplicate_template: "Dupliquer le modèle",
    btn_delete_template: "Supprimer le modèle", template_confirm_delete: "Supprimer ce modèle de planning ? Le planning d'aujourd'hui n'est pas affecté.",
    template_modal_title_new: "Enregistrer aujourd'hui comme modèle", template_modal_title_duplicate: "Dupliquer en un nouveau modèle",
    template_modal_title_edit: "Modifier le nom et la date du modèle", btn_edit_template: "Modifier nom et date", field_template_date: "Date",
    template_name_placeholder: "Ex. Jour ordinaire, Jour de sortie...", err_template_name_required: "Le modèle doit avoir un nom.",
    abandon_title: "Abandonner cette Étoile Guide ?", abandon_warning_1: "Avez-vous vraiment donné 100 % à", abandon_warning_2: " ? N'abandonnez que s'il ne sert plus votre Étoile Polaire — pas par paresse.",
    abandon_streak_note_1: "Série actuelle de l'Axe :", abandon_streak_note_2: "— la série exige toutes les Étoiles Guides, donc retirer", abandon_streak_note_3: "changera dès demain ce qu'il faut pour la garder.",
    btn_keep: "Garder", btn_abandon: "Abandonner",
    focus_axis_prefix: "Étoile Polaire :", focus_break_title: "Pause entre les tâches", focus_break_heading: "Reposez-vous, videz votre RAM mentale",
    btn_pause: "Pause", btn_resume: "Reprendre", btn_skip_break: "Passer la pause",
    focus_done_title: "Session de concentration terminée", focus_done_body_1: "Vous venez de nourrir", focus_done_body_2: "via", focus_label: "Focus", focus_this_session: "cette session", per_day_suffix: "jour", err_saochu_name_required: "Votre Étoile Polaire a besoin d'un nom.", saochu_hint_edit: "Gardez une seule Étoile Polaire à la fois pour éviter la surcharge.", saochu_hint_setup: "Cet axe de vie n'appartient qu'à vous — aucune suggestion ici, choisissez vous-même votre objectif central actuel. Gardez une seule Étoile Polaire à la fois.", trophy_year: "Coupe Année", trophy_month: "Coupe Mois", trophy_week: "Coupe Semaine",
    account_label: "Compte", auth_login_title: "Connexion", auth_register_title: "Inscription",
    auth_email: "E-mail", auth_password: "Mot de passe", auth_login_btn: "Se connecter", auth_register_btn: "S'inscrire",
    auth_guest_btn: "Continuer sans compte", auth_logout_btn: "Se déconnecter",
    auth_switch_to_register: "Pas de compte ? S'inscrire", auth_switch_to_login: "Déjà un compte ? Se connecter",
    auth_welcome: "Bonjour", auth_note: "Votre compte est stocké en toute sécurité sur le serveur et synchronisé sur tous vos appareils.",
    auth_check_email: "Inscription réussie — veuillez vérifier votre email pour confirmer votre compte avant de vous connecter.",
    auth_error_mismatch: "E-mail ou mot de passe incorrect.", auth_error_exists: "Cet e-mail est déjà enregistré.", auth_error_fields: "Entrez l'e-mail et le mot de passe.",
    lang_label: "Langue", lang_search: "Rechercher votre langue...", time_hms_hint: "h : min : s", pillar_name_placeholder: "ex. Apprendre l'anglais", pillar_desc_placeholder: "Une activité quotidienne concrète",
  },
  ja: {
    nav_dashboard: "軸", nav_timeboxing: "スケジュール", nav_pillars: "導きの星", nav_analytics: "実績",
    header_tagline: "ライフ・アクシス・システム",
    onboarding_title: "北極星が未設定です", onboarding_desc: "あなたの人生の軸はあなただけのもの。今のコア目標となる「北極星」を設定して始めましょう。", onboarding_cta: "北極星を設定する",
    saochu_setup_title: "北極星を設定する", saochu_edit_title: "北極星（メインの軸）",
    field_name: "名前", field_desc: "説明", btn_save: "保存",
    dash_streak_prefix: "軸のストリーク", dash_streak_hint: "ストリークを維持するには今日すべての導きの星を達成してください",
    dash_empty_title: "軸がまだ空です", dash_add_first: "最初の導きの星を追加",
    dash_empty_body_1: "具体的な行動である導きの星を自分で選んで、", dash_empty_body_2: "を毎日育てましょう。既成の提案はなく、あなた自身の選択だけです。",
    btn_schedule_today: "今日の予定を組む", btn_manage_pillars: "導きの星を管理", card_done: "達成",
    btn_add_block: "枠を追加",
    btn_add_pillar: "導きの星を追加", pillars_empty: "まだ導きの星がありません。", pillars_sub: "あなたの人生の軸を育てている導きの星。",
    no_desc: "説明なし", pillar_target_prefix: "目標", pillar_today_prefix: "今日",
    analytics_time_title: "今週の時間配分", analytics_time_sub: "直近7日間、導きの星別",
    achv_title: "実績", achv_trophy_title: "トロフィーケース", achv_history_title: "ストリーク履歴", noise_today_title: "今日の銀河ノイズ",
    achv_current_streak_label: "現在の軸のストリーク", achv_days_suffix: "日", achv_best_ever_prefix: "最高記録：",
    achv_rule_1: "1日がカウントされるのは、", achv_rule_all: "すべての", achv_rule_2: "導きの星が自分の目標を達成したときだけです — 一つでも欠けると、その日もストリークも失敗になります。",
    achv_trophy_sub: "7日連続 → 週間カップ · 30日 → 月間カップ · 365日 → 年間カップ",
    achv_history_sub: "これまでに達成した全ストリーク、長い順", achv_history_empty: "まだストリークの記録がありません。",
    trophy_empty_msg: "まだカップがありません — 7日間のストリーク（毎日すべての導きの星）を維持して、最初の週間カップを獲得しましょう。",
    noise_today_some: "が今日どの導きの星にも分類されていません。スケジュールを見直して軸に戻しましょう。", noise_today_none: "今日はノイズ活動が記録されていません。",
    btn_cancel: "キャンセル", btn_delete: "削除", btn_close: "閉じる",
    tb_hint: "固定の時間枠はありません — 各タスクは実際の瞬間、秒単位で開始・終了します。赤いライン（タイムライン）が触れているブロックだけがフォーカスモードを開始できます。オレンジのマーカーをドラッグして、1日の長さを調整してください。",
    tb_empty: "まだブロックがありません。「枠を追加」を押して、実際の時:分:秒を選んでください。",
    now_line_label: "タイムライン", status_not_yet: "まだ", status_overdue: "終了", deleted_pillar_label: "（削除済み）", noise_block_label: "銀河ノイズ", tb_default_schedule_name: "マイスケジュール",
    block_add_title: "枠を追加", block_edit_title: "枠を編集", field_start: "開始", field_end: "終了", btn_now: "今すぐ",
    duration_prefix: "長さ", duration_min_note: "最低30分必要", duration_invalid: "無効",
    noise_option_desc: "突発的な用事で、どの導きの星にも属さないもの — 軸から漏れている時間を把握するために使います",
    err_select_pillar_or_noise: "導きの星を選ぶか、銀河ノイズとして記録してください。", err_end_before_start: "終了時刻は開始時刻より後にしてください。", err_min_duration: "枠は最低30分の長さが必要です。",
    pillar_add_title: "導きの星を追加", pillar_edit_title: "導きの星を編集", field_target: "1日の最低目標（分）", field_color: "色",
    err_name_required: "導きの星には名前が必要です。", err_target_min: "最低目標は1日30分です。", pillar_btn_save_changes: "変更を保存",
    btn_save_as_template: "テンプレートとして保存", btn_update_template: "今日の内容でテンプレートを更新", btn_duplicate_template: "テンプレートを複製",
    btn_delete_template: "テンプレートを削除", template_confirm_delete: "このテンプレートを削除しますか？今日のスケジュールには影響しません。",
    template_modal_title_new: "今日の予定をテンプレートとして保存", template_modal_title_duplicate: "新しいテンプレートとして複製",
    template_modal_title_edit: "テンプレートの名前と日付を編集", btn_edit_template: "名前と日付を編集", field_template_date: "日付",
    template_name_placeholder: "例：平日、休みの日など", err_template_name_required: "テンプレートには名前が必要です。",
    abandon_title: "この導きの星をやめますか？", abandon_warning_1: "本当に100％の努力をしましたか、", abandon_warning_2: "に。北極星のためにならなくなった場合のみやめましょう — 怠けであきらめないでください。",
    abandon_streak_note_1: "現在の軸のストリーク：", abandon_streak_note_2: "— ストリークはすべての導きの星の達成が必要なので、", abandon_streak_note_3: "を外すと明日からの条件が変わります。",
    btn_keep: "維持する", btn_abandon: "やめる",
    focus_axis_prefix: "北極星：", focus_break_title: "タスク間の休憩", focus_break_heading: "休んで、メンタルRAMをリセット",
    btn_pause: "一時停止", btn_resume: "再開", btn_skip_break: "休憩をスキップ",
    focus_done_title: "フォーカスセッション完了", focus_done_body_1: "あなたはたった今、", focus_done_body_2: "を通じて育てました：", focus_label: "集中", focus_this_session: "このセッション", per_day_suffix: "日", err_saochu_name_required: "北極星には名前が必要です。", saochu_hint_edit: "認知過負荷を避けるため、北極星は一度に一つだけにしましょう。", saochu_hint_setup: "これはあなただけの人生の軸です — 提案はありません、今のコア目標を自分で選んでください。北極星は一度に一つだけにしましょう。", trophy_year: "年間カップ", trophy_month: "月間カップ", trophy_week: "週間カップ",
    account_label: "アカウント", auth_login_title: "ログイン", auth_register_title: "新規登録",
    auth_email: "メール", auth_password: "パスワード", auth_login_btn: "ログイン", auth_register_btn: "登録",
    auth_guest_btn: "アカウントなしで続ける", auth_logout_btn: "ログアウト",
    auth_switch_to_register: "アカウントをお持ちでない方はこちら", auth_switch_to_login: "すでにアカウントをお持ちの方はこちら",
    auth_welcome: "こんにちは", auth_note: "アカウントはサーバーに安全に保存され、すべての端末で同期されます。",
    auth_check_email: "登録が完了しました — ログインする前に、メールを確認してアカウントを認証してください。",
    auth_error_mismatch: "メールまたはパスワードが違います。", auth_error_exists: "このメールは既に登録されています。", auth_error_fields: "メールとパスワードを入力してください。",
    lang_label: "言語", lang_search: "言語を検索...", time_hms_hint: "時 : 分 : 秒", pillar_name_placeholder: "例：英語を学ぶ", pillar_desc_placeholder: "具体的な毎日の活動",
  },
  zh: {
    nav_dashboard: "生命轴", nav_timeboxing: "日程", nav_pillars: "引导星", nav_analytics: "成就",
    header_tagline: "生命轴系统",
    onboarding_title: "尚未设定北极星", onboarding_desc: "你的生命轴只属于你自己。设定你的北极星——当前的核心目标——即可开始。", onboarding_cta: "设定我的北极星",
    saochu_setup_title: "设置你的北极星", saochu_edit_title: "北极星（主生命轴）",
    field_name: "名称", field_desc: "描述", btn_save: "保存",
    dash_streak_prefix: "生命轴连续天数", dash_streak_hint: "今天完成所有引导星才能保持连续记录",
    dash_empty_title: "你的生命轴还是空的", dash_add_first: "添加第一颗引导星",
    dash_empty_body_1: "自己选择将滋养", dash_empty_body_2: "的具体行动——引导星——每天坚持。没有预设建议，只有你自己的选择。",
    btn_schedule_today: "安排今天", btn_manage_pillars: "管理引导星", card_done: "已完成",
    btn_add_block: "添加时段",
    btn_add_pillar: "添加引导星", pillars_empty: "还没有引导星。", pillars_sub: "正在滋养你生命轴的引导星。",
    no_desc: "没有描述", pillar_target_prefix: "目标", pillar_today_prefix: "今天",
    analytics_time_title: "本周时间分布", analytics_time_sub: "最近7天，按引导星统计",
    achv_title: "成就", achv_trophy_title: "奖杯柜", achv_history_title: "连续记录历史", noise_today_title: "今日星系噪音",
    achv_current_streak_label: "当前生命轴连续天数", achv_days_suffix: "天", achv_best_ever_prefix: "历史最高纪录：",
    achv_rule_1: "只有当", achv_rule_all: "所有", achv_rule_2: "引导星都达到各自目标时，这一天才算数——只要少一个，当天和连续记录都会失败。",
    achv_trophy_sub: "连续7天 → 周杯 · 30天 → 月杯 · 365天 → 年杯",
    achv_history_sub: "历史上达到过的所有连续记录，从长到短", achv_history_empty: "还没有连续记录。",
    trophy_empty_msg: "还没有奖杯——保持7天连续记录（每天完成所有引导星）即可获得第一个周杯。",
    noise_today_some: "今天还没有归入任何引导星。回顾一下日程，重新聚焦。", noise_today_none: "今天还没有记录任何噪音活动。",
    btn_cancel: "取消", btn_delete: "删除", btn_close: "关闭",
    tb_hint: "没有固定的时间格——每件事都在真实的时刻开始和结束，精确到秒。红线（时间线）触及到哪个时段，才能为它开启专注模式。拖动橙色标记来调整你一天的长度。",
    tb_empty: "还没有时段。点击“添加时段”，选择真实的时:分:秒。",
    now_line_label: "时间线", status_not_yet: "未到", status_overdue: "已过期", deleted_pillar_label: "（已删除）", noise_block_label: "星系噪音", tb_default_schedule_name: "我的日程",
    block_add_title: "添加时段", block_edit_title: "编辑时段", field_start: "开始", field_end: "结束", btn_now: "现在",
    duration_prefix: "时长", duration_min_note: "至少需要30分钟", duration_invalid: "无效",
    noise_option_desc: "临时发生、不服务于任何引导星的事情——用来看清自己每天有多少时间偏离了轴心",
    err_select_pillar_or_noise: "请选择一颗引导星，或标记为星系噪音。", err_end_before_start: "结束时间必须晚于开始时间。", err_min_duration: "时段长度必须至少30分钟。",
    pillar_add_title: "添加引导星", pillar_edit_title: "编辑引导星", field_target: "每日最低目标（分钟）", field_color: "颜色",
    err_name_required: "引导星的名称不能为空。", err_target_min: "最低目标为每天30分钟。", pillar_btn_save_changes: "保存更改",
    btn_save_as_template: "保存为模板", btn_update_template: "用今天的日程更新模板", btn_duplicate_template: "复制模板",
    btn_delete_template: "删除模板", template_confirm_delete: "要删除这个日程模板吗？不会影响今天的日程。",
    template_modal_title_new: "将今天的日程保存为模板", template_modal_title_duplicate: "复制为新模板",
    template_modal_title_edit: "编辑模板名称与日期", btn_edit_template: "编辑名称与日期", field_template_date: "日期",
    template_name_placeholder: "例如：平日、休息日……", err_template_name_required: "模板需要一个名称。",
    abandon_title: "要放弃这颗引导星吗？", abandon_warning_1: "你真的已经为", abandon_warning_2: "尽了100%的努力了吗？只有当它不再服务于你的北极星时才放弃——不要因为懒惰而放弃。",
    abandon_streak_note_1: "当前生命轴连续天数：", abandon_streak_note_2: "——由于连续记录需要完成所有引导星，去掉", abandon_streak_note_3: "从明天起会改变保持连续记录的条件。",
    btn_keep: "保留", btn_abandon: "放弃",
    focus_axis_prefix: "北极星：", focus_break_title: "任务间休息", focus_break_heading: "休息一下，清空大脑内存",
    btn_pause: "暂停", btn_resume: "继续", btn_skip_break: "跳过休息",
    focus_done_title: "专注时段已完成", focus_done_body_1: "你刚刚通过", focus_done_body_2: "滋养了", focus_label: "专注", focus_this_session: "这次专注", per_day_suffix: "天", err_saochu_name_required: "北极星需要一个名称。", saochu_hint_edit: "同一时间只应有一个北极星，以免认知超载。", saochu_hint_setup: "这是你独有的生命轴——没有现成建议，请自己选择当前的核心目标。同一时间只应有一个北极星。", trophy_year: "年度杯", trophy_month: "月度杯", trophy_week: "周度杯",
    account_label: "账户", auth_login_title: "登录", auth_register_title: "注册",
    auth_email: "邮箱", auth_password: "密码", auth_login_btn: "登录", auth_register_btn: "注册",
    auth_guest_btn: "继续但不使用账户", auth_logout_btn: "退出登录",
    auth_switch_to_register: "还没有账户？去注册", auth_switch_to_login: "已有账户？去登录",
    auth_welcome: "你好", auth_note: "你的账户安全地保存在服务器上，并会在所有设备间同步。",
    auth_check_email: "注册成功——登录前请查收邮件以验证你的账户。",
    auth_error_mismatch: "邮箱或密码错误。", auth_error_exists: "该邮箱已注册。", auth_error_fields: "请输入邮箱和密码。",
    lang_label: "语言", lang_search: "搜索你的语言...", time_hms_hint: "时 : 分 : 秒", pillar_name_placeholder: "例如：学英语", pillar_desc_placeholder: "具体的每日活动",
  },
  ru: {
    nav_dashboard: "Ось", nav_timeboxing: "Расписание", nav_pillars: "Путеводные звёзды", nav_analytics: "Достижения",
    header_tagline: "Система Оси Жизни",
    onboarding_title: "Полярная звезда не задана", onboarding_desc: "Ваша ось жизни — только ваша. Задайте свою Полярную звезду — текущую главную цель — чтобы начать.", onboarding_cta: "Задать мою Полярную звезду",
    saochu_setup_title: "Настройте свою Полярную звезду", saochu_edit_title: "Полярная звезда (главная ось)",
    field_name: "Название", field_desc: "Описание", btn_save: "Сохранить",
    dash_streak_prefix: "Серия оси жизни", dash_streak_hint: "выполните все Путеводные звёзды сегодня, чтобы сохранить серию",
    dash_empty_title: "Ваша ось пока пуста", dash_add_first: "Добавить первую Путеводную звезду",
    dash_empty_body_1: "Сами выберите Путеводные звёзды — конкретные действия — которые будут питать", dash_empty_body_2: "каждый день. Никаких готовых подсказок, только ваш собственный выбор.",
    btn_schedule_today: "Спланировать день", btn_manage_pillars: "Управление Путеводными звёздами", card_done: "Готово",
    btn_add_block: "Добавить блок",
    btn_add_pillar: "Добавить Путеводную звезду", pillars_empty: "Путеводных звёзд пока нет.", pillars_sub: "Путеводные звёзды, которые питают вашу ось жизни.",
    no_desc: "Нет описания", pillar_target_prefix: "Цель", pillar_today_prefix: "Сегодня",
    analytics_time_title: "Распределение времени за неделю", analytics_time_sub: "Последние 7 дней, по Путеводным звёздам",
    achv_title: "Достижения", achv_trophy_title: "Витрина кубков", achv_history_title: "История серий", noise_today_title: "Галактический шум сегодня",
    achv_current_streak_label: "Текущая серия оси жизни", achv_days_suffix: "дней", achv_best_ever_prefix: "Лучший результат:",
    achv_rule_1: "День засчитывается только если", achv_rule_all: "все", achv_rule_2: "Путеводные звёзды достигли своей цели — пропустите хоть одну, и день (и серия) провалены.",
    achv_trophy_sub: "7 дней подряд → Недельный кубок · 30 дней → Месячный кубок · 365 дней → Годовой кубок",
    achv_history_sub: "Все серии, которые вы когда-либо достигали, от самой длинной", achv_history_empty: "Серий пока не зафиксировано.",
    trophy_empty_msg: "Кубков пока нет — удерживайте серию 7 дней (все Путеводные звёзды, каждый день), чтобы получить первый Недельный кубок.",
    noise_today_some: "не отнесено ни к одной Путеводной звезде сегодня. Пересмотрите расписание, чтобы вернуть фокус.", noise_today_none: "Шумовая активность сегодня не зафиксирована.",
    btn_cancel: "Отмена", btn_delete: "Удалить", btn_close: "Закрыть",
    tb_hint: "Никаких фиксированных временных ячеек — каждое дело начинается и заканчивается в реальный момент, с точностью до секунды. Красная линия (Линия Времени) открывает Режим Фокуса только для того блока, которого она касается. Перетащите оранжевый маркер, чтобы задать, насколько длинным будет ваш день.",
    tb_empty: "Блоков пока нет. Нажмите «Добавить блок» и выберите реальные часы:минуты:секунды.",
    now_line_label: "Линия Времени", status_not_yet: "Ещё не наступило", status_overdue: "Просрочено", deleted_pillar_label: "(удалено)", noise_block_label: "Галактический шум", tb_default_schedule_name: "Моё расписание",
    block_add_title: "Добавить блок", block_edit_title: "Изменить блок", field_start: "Начало", field_end: "Конец", btn_now: "Сейчас",
    duration_prefix: "Длится", duration_min_note: "нужно минимум 30 мин", duration_invalid: "Некорректно",
    noise_option_desc: "Внезапное дело, не относящееся ни к одной Путеводной звезде — помогает увидеть, сколько времени утекает мимо вашей оси",
    err_select_pillar_or_noise: "Выберите Путеводную звезду или отметьте как Галактический шум.", err_end_before_start: "Время окончания должно быть позже времени начала.", err_min_duration: "Блок должен длиться минимум 30 минут.",
    pillar_add_title: "Добавить Путеводную звезду", pillar_edit_title: "Изменить Путеводную звезду", field_target: "Минимальная цель / день (минуты)", field_color: "Цвет",
    err_name_required: "У Путеводной звезды должно быть название.", err_target_min: "Минимальная цель — 30 минут в день.", pillar_btn_save_changes: "Сохранить изменения",
    btn_save_as_template: "Сохранить как шаблон", btn_update_template: "Обновить шаблон из сегодняшнего дня", btn_duplicate_template: "Дублировать шаблон",
    btn_delete_template: "Удалить шаблон", template_confirm_delete: "Удалить этот шаблон расписания? На сегодняшнее расписание это не повлияет.",
    template_modal_title_new: "Сохранить сегодняшний день как шаблон", template_modal_title_duplicate: "Дублировать в новый шаблон",
    template_modal_title_edit: "Изменить название и дату шаблона", btn_edit_template: "Изменить название и дату", field_template_date: "Дата",
    template_name_placeholder: "Например: Будний день, Выходной...", err_template_name_required: "У шаблона должно быть название.",
    abandon_title: "Отказаться от этой Путеводной звезды?", abandon_warning_1: "Вы действительно приложили 100% усилий к", abandon_warning_2: "? Отказывайтесь только если он больше не служит вашей Полярной звезде — не сдавайтесь из-за лени.",
    abandon_streak_note_1: "Текущая серия оси жизни:", abandon_streak_note_2: "— поскольку серия требует завершения всех Путеводных звёзд, удаление", abandon_streak_note_3: "изменит условие сохранения серии уже с завтрашнего дня.",
    btn_keep: "Оставить", btn_abandon: "Отказаться",
    focus_axis_prefix: "Полярная звезда:", focus_break_title: "Перерыв между делами", focus_break_heading: "Отдохните, очистите ментальную RAM",
    btn_pause: "Пауза", btn_resume: "Продолжить", btn_skip_break: "Пропустить перерыв",
    focus_done_title: "Сессия фокуса завершена", focus_done_body_1: "Вы только что напитали", focus_done_body_2: "через", focus_label: "Фокус", focus_this_session: "эту сессию", per_day_suffix: "день", err_saochu_name_required: "Полярной звезде нужно имя.", saochu_hint_edit: "Держите только одну Полярную звезду за раз, чтобы избежать перегрузки.", saochu_hint_setup: "Эта ось жизни принадлежит только вам — без готовых подсказок, выберите свою текущую главную цель сами. Держите только одну Полярную звезду за раз.", trophy_year: "Кубок Года", trophy_month: "Кубок Месяца", trophy_week: "Кубок Недели",
    account_label: "Аккаунт", auth_login_title: "Вход", auth_register_title: "Регистрация",
    auth_email: "Эл. почта", auth_password: "Пароль", auth_login_btn: "Войти", auth_register_btn: "Зарегистрироваться",
    auth_guest_btn: "Продолжить без аккаунта", auth_logout_btn: "Выйти",
    auth_switch_to_register: "Нет аккаунта? Регистрация", auth_switch_to_login: "Уже есть аккаунт? Войти",
    auth_welcome: "Привет", auth_note: "Ваш аккаунт надёжно хранится на сервере и синхронизируется на всех устройствах.",
    auth_check_email: "Регистрация прошла успешно — проверьте почту и подтвердите аккаунт перед входом.",
    auth_error_mismatch: "Неверный email или пароль.", auth_error_exists: "Этот email уже зарегистрирован.", auth_error_fields: "Введите email и пароль.",
    lang_label: "Язык", lang_search: "Найдите свой язык...", time_hms_hint: "ч : мин : с", pillar_name_placeholder: "напр. Учить английский", pillar_desc_placeholder: "Конкретное ежедневное действие",
  },
  th: {
    nav_dashboard: "แกนชีวิต", nav_timeboxing: "ตารางเวลา", nav_pillars: "ดาวนำทาง", nav_analytics: "ความสำเร็จ",
    header_tagline: "ระบบแกนชีวิต",
    onboarding_title: "ยังไม่มีดาวเหนือ", onboarding_desc: "แกนชีวิตของคุณเป็นของคุณเท่านั้น ตั้งดาวเหนือ — เป้าหมายหลักตอนนี้ของคุณ — เพื่อเริ่มต้น", onboarding_cta: "ตั้งดาวเหนือของฉัน",
    saochu_setup_title: "ตั้งค่าดาวเหนือของคุณ", saochu_edit_title: "ดาวเหนือ (แกนหลัก)",
    field_name: "ชื่อ", field_desc: "คำอธิบาย", btn_save: "บันทึก",
    dash_streak_prefix: "สถิติต่อเนื่องของแกนชีวิต", dash_streak_hint: "ต้องทำดาวนำทางทุกดวงให้ครบวันนี้เพื่อรักษาสถิติ",
    dash_empty_title: "แกนของคุณยังว่างอยู่", dash_add_first: "เพิ่มดาวนำทางดวงแรก",
    dash_empty_body_1: "เลือกดาวนำทาง — กิจกรรมที่เจาะจง — ที่จะหล่อเลี้ยง", dash_empty_body_2: "ทุกวันด้วยตัวเอง ไม่มีคำแนะนำสำเร็จรูป มีแต่ทางเลือกของคุณเอง",
    btn_schedule_today: "จัดตารางวันนี้", btn_manage_pillars: "จัดการดาวนำทาง", card_done: "สำเร็จแล้ว",
    btn_add_block: "เพิ่มช่วงเวลา",
    btn_add_pillar: "เพิ่มดาวนำทาง", pillars_empty: "ยังไม่มีดาวนำทาง", pillars_sub: "ดาวนำทางที่กำลังหล่อเลี้ยงแกนชีวิตของคุณ",
    no_desc: "ไม่มีคำอธิบาย", pillar_target_prefix: "เป้าหมาย", pillar_today_prefix: "วันนี้",
    analytics_time_title: "สัดส่วนเวลาสัปดาห์นี้", analytics_time_sub: "7 วันล่าสุด แยกตามดาวนำทาง",
    achv_title: "ความสำเร็จ", achv_trophy_title: "ตู้ถ้วยรางวัล", achv_history_title: "ประวัติสถิติต่อเนื่อง", noise_today_title: "สัญญาณรบกวนกาแล็กซีวันนี้",
    achv_current_streak_label: "สถิติต่อเนื่องของแกนชีวิตตอนนี้", achv_days_suffix: "วัน", achv_best_ever_prefix: "สถิติสูงสุดที่เคยทำได้:",
    achv_rule_1: "วันหนึ่งจะนับก็ต่อเมื่อ", achv_rule_all: "ทุก", achv_rule_2: "ดาวนำทางทำได้ตามเป้าหมายของตัวเอง — ขาดไปแม้แต่ดวงเดียว วันนั้นและสถิติต่อเนื่องก็ล้มเหลวทันที",
    achv_trophy_sub: "ต่อเนื่อง 7 วัน → ถ้วยรางวัลสัปดาห์ · 30 วัน → ถ้วยรางวัลเดือน · 365 วัน → ถ้วยรางวัลปี",
    achv_history_sub: "ทุกสถิติต่อเนื่องที่เคยทำได้ เรียงจากยาวไปสั้น", achv_history_empty: "ยังไม่มีสถิติต่อเนื่องที่บันทึกไว้",
    trophy_empty_msg: "ยังไม่มีถ้วยรางวัล — รักษาสถิติต่อเนื่อง 7 วัน (ทำดาวนำทางทุกดวงทุกวัน) เพื่อรับถ้วยรางวัลสัปดาห์แรก",
    noise_today_some: "ยังไม่ถูกจัดเข้าดาวนำทางดวงใดวันนี้ ลองดูตารางเวลาอีกครั้งเพื่อกลับสู่แกน", noise_today_none: "ยังไม่มีกิจกรรมรบกวนที่บันทึกไว้วันนี้",
    btn_cancel: "ยกเลิก", btn_delete: "ลบ", btn_close: "ปิด",
    tb_hint: "ไม่มีช่วงเวลาคงที่ — แต่ละงานเริ่มและจบตามเวลาจริง แม่นยำถึงวินาที เส้นสีแดง (เส้นเวลา) แตะช่วงไหนถึงจะเปิดโหมดโฟกัสให้ช่วงนั้นได้ ลากเครื่องหมายสีส้มเพื่อกำหนดว่าวันของคุณจะยาวแค่ไหน",
    tb_empty: "ยังไม่มีช่วงเวลา กด \"เพิ่มช่วงเวลา\" แล้วเลือกชั่วโมง:นาที:วินาทีจริง",
    now_line_label: "เส้นเวลา", status_not_yet: "ยังไม่ถึง", status_overdue: "เลยกำหนดแล้ว", deleted_pillar_label: "(ถูกลบแล้ว)", noise_block_label: "สัญญาณรบกวนกาแล็กซี", tb_default_schedule_name: "ตารางของฉัน",
    block_add_title: "เพิ่มช่วงเวลา", block_edit_title: "แก้ไขช่วงเวลา", field_start: "เริ่ม", field_end: "สิ้นสุด", btn_now: "ตอนนี้",
    duration_prefix: "ยาว", duration_min_note: "ต้องอย่างน้อย 30 นาที", duration_invalid: "ยังไม่ถูกต้อง",
    noise_option_desc: "เรื่องที่เกิดขึ้นกะทันหัน ไม่ได้รับใช้ดาวนำทางดวงใดเลย — ใช้เพื่อดูว่าคุณเสียเวลาไปนอกแกนเท่าไร",
    err_select_pillar_or_noise: "เลือกดาวนำทางหรือทำเครื่องหมายเป็นสัญญาณรบกวนกาแล็กซี", err_end_before_start: "เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม", err_min_duration: "ช่วงเวลาต้องยาวอย่างน้อย 30 นาที",
    pillar_add_title: "เพิ่มดาวนำทาง", pillar_edit_title: "แก้ไขดาวนำทาง", field_target: "เป้าหมายขั้นต่ำ / วัน (นาที)", field_color: "สี",
    err_name_required: "ดาวนำทางต้องมีชื่อ", err_target_min: "เป้าหมายขั้นต่ำคือ 30 นาที/วัน", pillar_btn_save_changes: "บันทึกการเปลี่ยนแปลง",
    btn_save_as_template: "บันทึกเป็นแม่แบบ", btn_update_template: "อัปเดตแม่แบบด้วยตารางวันนี้", btn_duplicate_template: "ทำสำเนาแม่แบบ",
    btn_delete_template: "ลบแม่แบบ", template_confirm_delete: "ลบแม่แบบตารางนี้หรือไม่? ตารางของวันนี้จะไม่ได้รับผลกระทบ",
    template_modal_title_new: "บันทึกตารางวันนี้เป็นแม่แบบ", template_modal_title_duplicate: "ทำสำเนาเป็นแม่แบบใหม่",
    template_modal_title_edit: "แก้ไขชื่อและวันที่ของแม่แบบ", btn_edit_template: "แก้ไขชื่อและวันที่", field_template_date: "วันที่",
    template_name_placeholder: "เช่น วันธรรมดา, วันไปเที่ยว...", err_template_name_required: "แม่แบบต้องมีชื่อ",
    abandon_title: "จะเลิกดาวนำทางดวงนี้ไหม?", abandon_warning_1: "คุณทุ่มเต็มที่ 100% กับ", abandon_warning_2: "แล้วจริงหรือยัง? เลิกก็ต่อเมื่อมันไม่ได้รับใช้ดาวเหนือของคุณแล้วเท่านั้น — อย่ายอมแพ้เพราะความขี้เกียจ",
    abandon_streak_note_1: "สถิติต่อเนื่องของแกนชีวิตตอนนี้:", abandon_streak_note_2: "— เพราะสถิติต่อเนื่องต้องทำครบทุกดาวนำทาง การตัด", abandon_streak_note_3: "ออกจะเปลี่ยนเงื่อนไขการรักษาสถิติตั้งแต่พรุ่งนี้",
    btn_keep: "เก็บไว้", btn_abandon: "เลิก",
    focus_axis_prefix: "ดาวเหนือ:", focus_break_title: "ช่วงพักระหว่างงาน", focus_break_heading: "พักผ่อน ล้าง RAM สมอง",
    btn_pause: "หยุดชั่วคราว", btn_resume: "ทำต่อ", btn_skip_break: "ข้ามช่วงพัก",
    focus_done_title: "จบเซสชันโฟกัสแล้ว", focus_done_body_1: "คุณเพิ่งหล่อเลี้ยง", focus_done_body_2: "ผ่าน", focus_label: "โฟกัส", focus_this_session: "เซสชันนี้", per_day_suffix: "วัน", err_saochu_name_required: "ดาวเหนือต้องมีชื่อ", saochu_hint_edit: "ควรมีดาวเหนือเพียงดวงเดียวในแต่ละช่วงเวลา เพื่อไม่ให้สมองทำงานหนักเกินไป", saochu_hint_setup: "นี่คือแกนชีวิตของคุณเอง — ไม่มีคำแนะนำสำเร็จรูป จงเลือกเป้าหมายหลักตอนนี้ด้วยตัวเอง ควรมีดาวเหนือเพียงดวงเดียวในแต่ละช่วงเวลา", trophy_year: "ถ้วยรางวัลประจำปี", trophy_month: "ถ้วยรางวัลประจำเดือน", trophy_week: "ถ้วยรางวัลประจำสัปดาห์",
    account_label: "บัญชี", auth_login_title: "เข้าสู่ระบบ", auth_register_title: "สมัครสมาชิก",
    auth_email: "อีเมล", auth_password: "รหัสผ่าน", auth_login_btn: "เข้าสู่ระบบ", auth_register_btn: "สมัครสมาชิก",
    auth_guest_btn: "ใช้งานต่อโดยไม่ต้องมีบัญชี", auth_logout_btn: "ออกจากระบบ",
    auth_switch_to_register: "ยังไม่มีบัญชี? สมัครสมาชิก", auth_switch_to_login: "มีบัญชีแล้ว? เข้าสู่ระบบ",
    auth_welcome: "สวัสดี", auth_note: "บัญชีของคุณถูกเก็บไว้อย่างปลอดภัยบนเซิร์ฟเวอร์ และซิงค์ได้ในทุกอุปกรณ์",
    auth_check_email: "สมัครสำเร็จแล้ว — กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชีก่อนเข้าสู่ระบบ",
    auth_error_mismatch: "อีเมลหรือรหัสผ่านไม่ถูกต้อง", auth_error_exists: "อีเมลนี้ถูกสมัครไปแล้ว", auth_error_fields: "กรุณากรอกอีเมลและรหัสผ่าน",
    lang_label: "ภาษา", lang_search: "ค้นหาภาษาของคุณ...", time_hms_hint: "ชม. : นาที : วินาที", pillar_name_placeholder: "เช่น เรียนภาษาอังกฤษ", pillar_desc_placeholder: "กิจกรรมประจำวันที่ชัดเจน",
  },
};

function useT(lang) {
  return useMemo(() => {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.vi;
    return (key) => dict[key] || TRANSLATIONS.en[key] || TRANSLATIONS.vi[key] || key;
  }, [lang]);
}

function orbitPos(index, total, radiusX, radiusY) {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  return {
    x: Math.cos(angle) * radiusX,
    y: Math.sin(angle) * radiusY,
  };
}

// ---------------------------------------------------------------------------
// Main app
// ---------------------------------------------------------------------------

export default function AxisSystem() {
  const [view, setView] = useState("dashboard");
  const [loaded, setLoaded] = useState(false);

  const [lang, setLang] = useState("vi");
  const [showLangModal, setShowLangModal] = useState(false);
  const t = useT(lang);

  const [activeProfile, setActiveProfile] = useState(null); // null = guest, else account email (display only)
  const [activeUserId, setActiveUserId] = useState(null); // Supabase auth user id — the real DB key
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [saoChu, setSaoChu] = useState(null); // null until the person defines their own
  const [showSaoChuModal, setShowSaoChuModal] = useState(false);

  const [pillars, setPillars] = useState([]);
  const [logs, setLogs] = useState([]); // {id, pillarId, minutes, date:'YYYY-MM-DD'}
  // Schedules are tabs — each one a fully independent, named+dated set of
  // blocks (and its own dayEndSec). Nothing auto-clears or auto-resets;
  // a schedule only ever changes when the person edits or deletes it.
  const [schedules, setSchedules] = useState([]); // {id, name, date, blocks:[...], dayEndSec}
  const [activeScheduleId, setActiveScheduleId] = useState(null);
  const [scheduleModal, setScheduleModal] = useState(null); // {mode:'new'|'duplicate'|'edit', data:{name, date, sourceId?}}

  const [pillarModal, setPillarModal] = useState(null); // {mode:'add'|'edit', data}
  const [deleteTarget, setDeleteTarget] = useState(null); // pillar id
  const [blockModal, setBlockModal] = useState(null); // {mode:'add'|'edit', data}

  const [session, setSession] = useState(null); // {pillarId, phase:'focus'|'break', secondsLeft, running}

  const activeSchedule = schedules.find((s) => s.id === activeScheduleId) || schedules[0] || null;
  const blocks = activeSchedule ? activeSchedule.blocks : [];
  const dayEndSec = activeSchedule ? activeSchedule.dayEndSec : DEFAULT_DAY_END_SEC;

  // Loads (or blanks) life-data for whichever profile is active — used both
  // on first mount and whenever the person logs in/out/registers.
  const loadProfileData = async (userId) => {
    const saved = await loadState(userId);
    if (saved) {
      setSaoChu(saved.saoChu || null);
      setPillars(saved.pillars || []);
      setLogs(saved.logs || []);
      if (Array.isArray(saved.schedules) && saved.schedules.length) {
        // Already in the current (tabs) format.
        setSchedules(saved.schedules);
        setActiveScheduleId(saved.activeScheduleId || saved.schedules[0].id);
      } else {
        // Older save (single day's blocks + separate templates) — fold both
        // into one schedules list so nothing from before is lost.
        const dayEnd = typeof saved.dayEndSec === "number" ? saved.dayEndSec : DEFAULT_DAY_END_SEC;
        const todaySchedule = {
          id: uid(),
          name: t("tb_default_schedule_name"),
          date: saved.blocksDate || todayStr(),
          blocks: saved.blocks || [],
          dayEndSec: dayEnd,
        };
        const oldTemplates = (saved.templates || []).map((tpl) => ({
          id: tpl.id || uid(), name: tpl.name, date: tpl.date || todayStr(),
          blocks: tpl.blocks || [], dayEndSec: dayEnd,
        }));
        const migrated = [todaySchedule, ...oldTemplates];
        setSchedules(migrated);
        setActiveScheduleId(todaySchedule.id);
      }
    } else {
      setSaoChu(null);
      setPillars([]);
      setLogs([]);
      const fresh = { id: uid(), name: t("tb_default_schedule_name"), date: todayStr(), blocks: [], dayEndSec: DEFAULT_DAY_END_SEC };
      setSchedules([fresh]);
      setActiveScheduleId(fresh.id);
    }
  };

  // ---- Load saved state once on mount -----------------------------------
  useEffect(() => {
    (async () => {
      try {
        const savedLang = localStorage.getItem(LANG_KEY);
        if (savedLang) setLang(JSON.parse(savedLang));
      } catch (e) { /* default vi */ }

      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        setActiveProfile(session.user.email);
        setActiveUserId(session.user.id);
        await loadProfileData(session.user.id);
      } else {
        await loadProfileData(null);
      }
      setLoaded(true);
    })();

    // Keeps state in sync if the session changes in another tab, or after
    // an email-confirmation redirect brings the person back signed in.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && session.user) {
        setActiveProfile(session.user.email);
        setActiveUserId(session.user.id);
      } else {
        setActiveProfile(null);
        setActiveUserId(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ---- Save state whenever it changes (after initial load) --------------
  useEffect(() => {
    if (!loaded) return;
    saveState(activeUserId, { saoChu, pillars, logs, schedules, activeScheduleId });
  }, [loaded, activeUserId, saoChu, pillars, logs, schedules, activeScheduleId]);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(LANG_KEY, JSON.stringify(lang)); } catch (e) {}
  }, [loaded, lang]);

  // ---- Auth actions -------------------------------------------------------
  const registerAccount = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return error.message;
    if (!data.session) {
      // Email confirmation is required before a session is issued — nothing
      // to load yet, the person will log in for real after confirming.
      return t("auth_check_email");
    }
    setActiveProfile(data.user.email);
    setActiveUserId(data.user.id);
    await loadProfileData(data.user.id);
    return null;
  };
  const loginAccount = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return t("auth_error_mismatch");
    setActiveProfile(data.user.email);
    setActiveUserId(data.user.id);
    await loadProfileData(data.user.id);
    return null;
  };
  const logoutAccount = async () => {
    await supabase.auth.signOut();
    setActiveProfile(null);
    setActiveUserId(null);
    await loadProfileData(null);
  };

  // Schedules are tabs that persist across days by design — no rollover
  // clearing here (unlike the old single-day model). A schedule only ever
  // changes when the person edits, duplicates, or deletes it themselves.

  const todayMinutesMap = useMemo(() => {
    const map = {};
    const today = todayStr();
    for (const l of logs) {
      if (l.date !== today) continue;
      map[l.pillarId] = (map[l.pillarId] || 0) + l.minutes;
    }
    return map;
  }, [logs]);
  const todayMinutes = (pillarId) => todayMinutesMap[pillarId] || 0;

  const noiseMinutesToday = todayMinutes("noise");

  // Computed once per (pillars, logs) change instead of on every render —
  // the focus-session timer ticks App's state every second, so without this
  // memo the whole streak/trophy history would be recomputed 60x a minute.
  const streakRuns = useMemo(() => computeOverallStreakRuns(pillars, logs), [pillars, logs]);
  const overallStreak = useMemo(() => currentStreakFromRuns(streakRuns), [streakRuns]);

  // ---- Timer engine --------------------------------------------------
  const tickRef = useRef(null);
  useEffect(() => {
    if (session && session.running) {
      tickRef.current = setInterval(() => {
        setSession((s) => {
          if (!s) return s;
          if (s.secondsLeft <= 1) {
            if (s.phase === "focus") {
              // log completed session, move to break
              setLogs((prev) => [...prev, { id: uid(), pillarId: s.pillarId, minutes: 25, date: todayStr() }]);
              return { ...s, phase: "break", secondsLeft: 5 * 60, running: true };
            }
            return { ...s, running: false, secondsLeft: 0, phase: "done" };
          }
          return { ...s, secondsLeft: s.secondsLeft - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(tickRef.current);
  }, [session && session.running, session && session.phase]);

  const startFocus = (pillarId) => {
    setSession({ pillarId, phase: "focus", secondsLeft: 25 * 60, running: true });
  };

  const closeSession = () => {
    clearInterval(tickRef.current);
    setSession(null);
  };

  // ---- Pillar CRUD -----------------------------------------------------
  const savePillar = (data) => {
    if (data.id) {
      setPillars((prev) => prev.map((p) => (p.id === data.id ? { ...p, ...data } : p)));
    } else {
      setPillars((prev) => [...prev, { ...data, id: uid() }]);
    }
    setPillarModal(null);
  };

  const confirmDelete = () => {
    setPillars((prev) => prev.filter((p) => p.id !== deleteTarget));
    setSchedules((prev) => prev.map((s) => ({ ...s, blocks: s.blocks.filter((b) => b.pillarId !== deleteTarget) })));
    setDeleteTarget(null);
  };

  // ---- Timeboxing (continuous, second-level precision) -----------------
  // Both operate on whichever schedule tab is currently active.
  const saveBlock = (data) => {
    setSchedules((prev) => prev.map((s) => {
      if (s.id !== activeScheduleId) return s;
      const nextBlocks = data.id
        ? s.blocks.map((b) => (b.id === data.id ? { ...b, ...data } : b))
        : [...s.blocks, { ...data, id: uid() }];
      return { ...s, blocks: nextBlocks };
    }));
    setBlockModal(null);
  };
  const deleteBlock = (id) => {
    setSchedules((prev) => prev.map((s) => (
      s.id === activeScheduleId ? { ...s, blocks: s.blocks.filter((b) => b.id !== id) } : s
    )));
    setBlockModal(null);
  };

  // ---- Schedule tabs ------------------------------------------------------
  // Each schedule is an independent, named+dated tab (its own blocks and
  // dayEndSec). Nothing here is ever auto-cleared or auto-applied — a
  // schedule only changes when the person edits, switches, or deletes it.
  const addSchedule = (name, date) => {
    const fresh = { id: uid(), name, date, blocks: [], dayEndSec: DEFAULT_DAY_END_SEC };
    setSchedules((prev) => [...prev, fresh]);
    setActiveScheduleId(fresh.id);
    setScheduleModal(null);
  };
  const duplicateSchedule = (sourceId, name, date) => {
    const source = schedules.find((s) => s.id === sourceId);
    if (!source) { setScheduleModal(null); return; }
    const copy = { id: uid(), name, date, dayEndSec: source.dayEndSec, blocks: source.blocks.map((b) => ({ ...b, id: uid() })) };
    setSchedules((prev) => [...prev, copy]);
    setActiveScheduleId(copy.id);
    setScheduleModal(null);
  };
  const editScheduleMeta = (id, name, date) => {
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, name, date } : s)));
    setScheduleModal(null);
  };
  const switchSchedule = (id) => setActiveScheduleId(id);
  const changeActiveDayEnd = (sec) => {
    setSchedules((prev) => prev.map((s) => (s.id === activeScheduleId ? { ...s, dayEndSec: sec } : s)));
  };
  const deleteSchedule = (id) => {
    setSchedules((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      if (remaining.length === 0) {
        // Never leave zero tabs — a fresh empty one takes its place.
        const fresh = { id: uid(), name: t("tb_default_schedule_name"), date: todayStr(), blocks: [], dayEndSec: DEFAULT_DAY_END_SEC };
        setActiveScheduleId(fresh.id);
        return [fresh];
      }
      if (activeScheduleId === id) setActiveScheduleId(remaining[0].id);
      return remaining;
    });
  };

  const deletingPillar = pillars.find((p) => p.id === deleteTarget);

  if (!loaded) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center">
        <div className="axis-pulse w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 via-sky-500 to-orange-400" />
        <style>{`
          @keyframes axis-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(56,189,248,0.35), 0 0 22px 4px rgba(56,189,248,0.16); } 50% { box-shadow: 0 0 0 6px rgba(56,189,248,0), 0 0 32px 8px rgba(56,189,248,0.24); } }
          .axis-pulse { animation: axis-pulse 1.2s ease-in-out infinite; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-200" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Space Grotesk', system-ui, sans-serif; }
        @keyframes axis-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(56,189,248,0.35), 0 0 22px 4px rgba(56,189,248,0.16); } 50% { box-shadow: 0 0 0 6px rgba(56,189,248,0), 0 0 32px 8px rgba(56,189,248,0.24); } }
        .axis-pulse { animation: axis-pulse 3.4s ease-in-out infinite; }
        @keyframes drift { 0% { transform: translateY(0px); } 50% { transform: translateY(-6px); } 100% { transform: translateY(0px); } }
        .axis-drift { animation: drift 6s ease-in-out infinite; }
        @keyframes twinkle { 0%,100% { opacity: 0.15; } 50% { opacity: 0.7; } }
        .star-dot { animation: twinkle 4s ease-in-out infinite; }
        @keyframes trophy-glow { 0%,100% { box-shadow: 0 0 0 0 rgba(252,211,77,0.4), 0 0 24px 4px rgba(252,211,77,0.25); } 50% { box-shadow: 0 0 0 6px rgba(252,211,77,0), 0 0 36px 10px rgba(252,211,77,0.4); } }
        .trophy-glow { animation: trophy-glow 2.6s ease-in-out infinite; }
      `}</style>

      <Starfield />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <Header
          saoChu={saoChu}
          onEditSaoChu={() => setShowSaoChuModal(true)}
          t={t}
          onOpenLang={() => setShowLangModal(true)}
          onOpenAuth={() => setShowAuthModal(true)}
          activeProfile={activeProfile}
        />

        {saoChu && <NavTabs view={view} setView={setView} t={t} />}

        {!saoChu && (
          <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl">
            <Star size={22} className="text-orange-400 fill-orange-400 mx-auto mb-3" />
            <h2 className="font-display text-lg font-semibold text-white mb-1.5">{t("onboarding_title")}</h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-5">{t("onboarding_desc")}</p>
            <button onClick={() => setShowSaoChuModal(true)} className="rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium px-4 py-2.5 text-sm transition-colors">
              {t("onboarding_cta")}
            </button>
          </div>
        )}

        {saoChu && view === "dashboard" && (
          <Dashboard
            saoChu={saoChu}
            pillars={pillars}
            todayMinutes={todayMinutes}
            overallStreak={overallStreak}
            t={t}
            onManage={() => setView("pillars")}
            onTimebox={() => setView("timeboxing")}
            onAddPillar={() => setPillarModal({ mode: "add", data: { name: "", description: "", color: "sky", target: 30 } })}
          />
        )}

        {saoChu && view === "timeboxing" && (
          <Timeboxing
            pillars={pillars}
            blocks={blocks}
            dayEndSec={dayEndSec}
            onChangeDayEnd={changeActiveDayEnd}
            t={t}
            onAddBlock={(prefill) => setBlockModal({ mode: "add", data: prefill })}
            onEditBlock={(b) => setBlockModal({ mode: "edit", data: b })}
            onStartFocus={startFocus}
            schedules={schedules}
            activeScheduleId={activeScheduleId}
            onSwitchSchedule={switchSchedule}
            onAddSchedule={() => setScheduleModal({ mode: "new", data: { name: "", date: todayStr() } })}
            onDuplicateSchedule={(id) => setScheduleModal({ mode: "duplicate", data: { name: "", date: todayStr(), sourceId: id } })}
            onEditSchedule={(id) => {
              const s = schedules.find((sc) => sc.id === id);
              if (s) setScheduleModal({ mode: "edit", data: { name: s.name, date: s.date || todayStr(), sourceId: id } });
            }}
            onDeleteSchedule={deleteSchedule}
          />
        )}

        {saoChu && view === "pillars" && (
          <PillarsView
            pillars={pillars}
            logs={logs}
            todayMinutes={todayMinutes}
            t={t}
            onAdd={() => setPillarModal({ mode: "add", data: { name: "", description: "", color: "sky", target: 30 } })}
            onEdit={(p) => setPillarModal({ mode: "edit", data: p })}
            onDelete={(id) => setDeleteTarget(id)}
          />
        )}

        {saoChu && view === "analytics" && (
          <Analytics pillars={pillars} logs={logs} noiseMinutesToday={noiseMinutesToday} streakRuns={streakRuns} t={t} />
        )}
      </div>

      {(showSaoChuModal || !saoChu) && (
        <SaoChuModal
          saoChu={saoChu || { name: "", description: "" }}
          dismissible={!!saoChu}
          t={t}
          onClose={() => setShowSaoChuModal(false)}
          onSave={(v) => { setSaoChu(v); setShowSaoChuModal(false); }}
        />
      )}

      {showLangModal && (
        <LanguageModal
          lang={lang}
          t={t}
          onClose={() => setShowLangModal(false)}
          onPick={(code) => { setLang(code); setShowLangModal(false); }}
        />
      )}

      {showAuthModal && (
        <AuthModal
          t={t}
          activeProfile={activeProfile}
          onClose={() => setShowAuthModal(false)}
          onLogin={loginAccount}
          onRegister={registerAccount}
          onLogout={async () => { await logoutAccount(); setShowAuthModal(false); }}
        />
      )}

      {pillarModal && (
        <PillarModal
          mode={pillarModal.mode}
          data={pillarModal.data}
          t={t}
          onClose={() => setPillarModal(null)}
          onSave={savePillar}
        />
      )}

      {deleteTarget && deletingPillar && (
        <AbandonModal
          pillar={deletingPillar}
          overallStreak={overallStreak}
          t={t}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}

      {blockModal && (
        <BlockModal
          mode={blockModal.mode}
          data={blockModal.data}
          pillars={pillars}
          t={t}
          onClose={() => setBlockModal(null)}
          onSave={saveBlock}
          onDelete={deleteBlock}
        />
      )}

      {scheduleModal && (
        <ScheduleModal
          mode={scheduleModal.mode}
          initialName={scheduleModal.data.name}
          initialDate={scheduleModal.data.date}
          t={t}
          onClose={() => setScheduleModal(null)}
          onSave={(name, date) => {
            if (scheduleModal.mode === "duplicate") duplicateSchedule(scheduleModal.data.sourceId, name, date);
            else if (scheduleModal.mode === "edit") editScheduleMeta(scheduleModal.data.sourceId, name, date);
            else addSchedule(name, date);
          }}
        />
      )}

      {session && (
        <FocusSession
          session={session}
          pillar={pillars.find((p) => p.id === session.pillarId)}
          saoChu={saoChu}
          t={t}
          onToggle={() => setSession((s) => ({ ...s, running: !s.running }))}
          onReset={() => setSession((s) => ({ ...s, secondsLeft: 25 * 60, running: false, phase: "focus" }))}
          onSkipBreak={closeSession}
          onClose={closeSession}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------

function Starfield() {
  const dots = useMemo(
    () => Array.from({ length: 60 }, () => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 1.6 + 0.6,
      delay: Math.random() * 4,
    })),
    []
  );
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(56,189,248,0.08), transparent 55%), radial-gradient(ellipse at 90% 110%, rgba(249,115,22,0.06), transparent 45%)" }} />
      {dots.map((d, i) => (
        <div
          key={i}
          className="star-dot absolute rounded-full bg-slate-300"
          style={{ top: `${d.top}%`, left: `${d.left}%`, width: d.size, height: d.size, animationDelay: `${d.delay}s` }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header & nav
// ---------------------------------------------------------------------------

function Header({ saoChu, onEditSaoChu, t, onOpenLang, onOpenAuth, activeProfile }) {
  return (
    <div className="relative pt-8 pb-4 flex items-start justify-between gap-3 flex-wrap">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-sky-400/80 font-medium mb-1">
          <Orbit size={14} />
          {t("header_tagline")}
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-white">Axis System</h1>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onOpenLang}
          title={t("lang_label")}
          className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/60 w-9 h-9 text-slate-400 hover:text-sky-400 hover:border-sky-500/50 transition-colors"
        >
          <Globe size={15} />
        </button>
        <button
          onClick={onOpenAuth}
          title={t("account_label")}
          className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 px-2.5 h-9 text-slate-400 hover:text-sky-400 hover:border-sky-500/50 transition-colors"
        >
          <User size={15} />
          {activeProfile && <span className="hidden sm:inline text-xs text-slate-300 max-w-[110px] truncate">{activeProfile}</span>}
        </button>
        {saoChu && (
          <button
            onClick={onEditSaoChu}
            className="group flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 h-9 text-sm hover:border-sky-500/50 hover:bg-slate-900 transition-colors"
          >
            <Star size={15} className="text-orange-400 fill-orange-400" />
            <span className="text-white font-medium max-w-[140px] truncate">{saoChu.name}</span>
            <PenLine size={13} className="text-slate-500 group-hover:text-sky-400" />
          </button>
        )}
      </div>
    </div>
  );
}

function NavTabs({ view, setView, t }) {
  const tabs = [
    { id: "dashboard", label: t("nav_dashboard"), icon: Orbit },
    { id: "timeboxing", label: t("nav_timeboxing"), icon: CalendarDays },
    { id: "pillars", label: t("nav_pillars"), icon: Sparkles },
    { id: "analytics", label: t("nav_analytics"), icon: BarChart3 },
  ];
  return (
    <div className="flex gap-1 border-b border-slate-800 mb-6 overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = view === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              active ? "border-sky-400 text-white" : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            <Icon size={15} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard — orbit visualization
// ---------------------------------------------------------------------------

function Dashboard({ saoChu, pillars, todayMinutes, overallStreak, t, onManage, onTimebox, onAddPillar }) {
  const RX = 240;
  const RY = 190;

  if (pillars.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="axis-pulse w-24 h-24 rounded-full bg-gradient-to-br from-sky-400 via-sky-500 to-orange-400 flex flex-col items-center justify-center mx-auto mb-6">
          <Star size={18} className="text-white fill-white mb-1" />
          <span className="font-display text-[10px] font-semibold text-white leading-tight px-1">{saoChu.name}</span>
        </div>
        <h2 className="font-display text-lg font-semibold text-white mb-1.5">{t("dash_empty_title")}</h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mb-5">{t("dash_empty_body_1")} "{saoChu.name}" {t("dash_empty_body_2")}</p>
        <button onClick={onAddPillar} className="flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium px-4 py-2.5 text-sm transition-colors mx-auto">
          <Plus size={16} /> {t("dash_add_first")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="relative mx-auto mb-8" style={{ height: 400, maxWidth: 640 }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative" style={{ width: RX * 2, height: RY * 2 }}>
            {/* orbit path */}
            <div
              className="absolute border border-dashed border-slate-700/60 rounded-full"
              style={{ left: "50%", top: "50%", width: RX * 2, height: RY * 2, transform: "translate(-50%,-50%)" }}
            />
            {/* central Sao Chủ — its own protected hub, clearly separate from the orbit */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="absolute inset-0 -m-5 rounded-full border border-sky-400/15" />
              <div className="axis-drift">
                <div className="axis-pulse w-24 h-24 rounded-full bg-gradient-to-br from-sky-400 via-sky-500 to-orange-400 flex flex-col items-center justify-center text-center p-3 shadow-xl">
                  <Star size={19} className="text-white fill-white mb-1" />
                  <span className="font-display text-[11px] font-semibold text-white leading-tight px-1">{saoChu.name}</span>
                </div>
              </div>
            </div>
            {/* pillars orbiting */}
            {pillars.map((p, i) => {
              const pos = orbitPos(i, pillars.length, RX, RY);
              const c = swatch(p.color);
              const minutes = todayMinutes(p.id);
              const pct = Math.min(100, Math.round((minutes / p.target) * 100));
              return (
                <div
                  key={p.id}
                  className="absolute left-1/2 top-1/2 flex flex-col items-center"
                  style={{ transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))` }}
                >
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${c.grad} flex items-center justify-center shadow-lg ring-2 ring-slate-950`}>
                    <span className="font-display text-[10px] font-semibold text-slate-950 text-center px-1 leading-tight">{p.name}</span>
                  </div>
                  <span className={`mt-1.5 text-[11px] font-medium ${c.text}`}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mb-6">
        <Flame size={16} className="text-orange-400" />
        <span className="text-sm text-slate-300">{t("dash_streak_prefix")}: <span className="font-display font-semibold text-white">{overallStreak}</span></span>
        <span className="text-xs text-slate-600">· {t("dash_streak_hint")}</span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {pillars.map((p) => {
          const c = swatch(p.color);
          const minutes = todayMinutes(p.id);
          const pct = Math.min(100, Math.round((minutes / p.target) * 100));
          const done = pct >= 100;
          return (
            <div key={p.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                  <span className="text-sm font-medium text-slate-200">{p.name}</span>
                </div>
                {done && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <Check size={12} /> {t("card_done")}
                  </span>
                )}
              </div>
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden mb-1.5">
                <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="text-xs text-slate-500">{fmtMin(minutes)} / {fmtMin(p.target)} {t("pillar_today_prefix").toLowerCase()}</div>
            </div>
          );
        })}
        {pillars.length === 0 && (
          <div className="col-span-full text-center text-sm text-slate-500 py-10 border border-dashed border-slate-800 rounded-2xl">
            {t("pillars_empty")}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={onTimebox} className="flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium px-4 py-2.5 text-sm transition-colors">
          <Clock size={16} /> {t("btn_schedule_today")}
        </button>
        <button onClick={onManage} className="flex items-center gap-2 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-200 font-medium px-4 py-2.5 text-sm transition-colors">
          <Settings2 size={16} /> {t("btn_manage_pillars")}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeboxing
// ---------------------------------------------------------------------------

function Timeboxing({ pillars, blocks, dayEndSec, onChangeDayEnd, t, onAddBlock, onEditBlock, onStartFocus, schedules, activeScheduleId, onSwitchSchedule, onAddSchedule, onDuplicateSchedule, onEditSchedule, onDeleteSchedule }) {
  const sorted = [...blocks].sort((a, b) => a.start - b.start);

  // The visible range always covers at least the dragged end-of-day marker,
  // but auto-extends further if a block happens to run later than that —
  // nothing is ever clipped or capped.
  const latestBlockEnd = sorted.length ? Math.max(...sorted.map((b) => b.end)) : DAY_START_SEC;
  const effectiveEnd = Math.min(Math.max(dayEndSec, latestBlockEnd), HARD_MAX_SEC);
  const totalSec = Math.max(effectiveEnd - DAY_START_SEC, 3600);
  const containerHeight = (totalSec / 3600) * PX_PER_HOUR;
  const hourMarks = Array.from({ length: Math.ceil(totalSec / 3600) + 1 }, (_, i) => HOURS[0] + i).filter(
    (h) => h * 3600 <= effectiveEnd
  );

  const [now, setNow] = useState(() => nowSecOfDay());
  useEffect(() => {
    const intervalId = setInterval(() => setNow(nowSecOfDay()), 30000);
    return () => clearInterval(intervalId);
  }, []);
  const nowInRange = now >= DAY_START_SEC && now <= effectiveEnd;
  const nowTop = ((now - DAY_START_SEC) / totalSec) * containerHeight;

  const lastEnd = sorted.length ? sorted[sorted.length - 1].end : DAY_START_SEC;
  const defaultStart = Math.max(DAY_START_SEC, Math.min(lastEnd, HARD_MAX_SEC - MIN_BLOCK_SEC));
  const defaultEnd = Math.min(defaultStart + MIN_BLOCK_SEC, HARD_MAX_SEC);

  // ---- Drag-to-resize the end-of-day marker -----------------------------
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [dragPreview, setDragPreview] = useState(null); // seconds, while actively dragging

  const secFromPointer = (clientY) => {
    const rect = trackRef.current.getBoundingClientRect();
    const px = clientY - rect.top;
    const raw = DAY_START_SEC + (px / PX_PER_HOUR) * 3600;
    const snapped = Math.round(raw / 300) * 300; // snap to 5-minute increments
    return Math.max(DAY_START_SEC + 3600, Math.min(snapped, HARD_MAX_SEC));
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => setDragPreview(secFromPointer(e.clientY ?? (e.touches && e.touches[0].clientY)));
    const onUp = (e) => {
      const sec = secFromPointer(e.clientY ?? (e.changedTouches && e.changedTouches[0].clientY));
      onChangeDayEnd(sec);
      setDragging(false);
      setDragPreview(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging]);

  const markerSec = dragging && dragPreview !== null ? dragPreview : dayEndSec;
  const markerTop = ((markerSec - DAY_START_SEC) / totalSec) * containerHeight;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <p className="text-sm text-slate-500">{t("tb_hint")}</p>
        <button
          onClick={() => onAddBlock({ start: defaultStart, end: defaultEnd, pillarId: pillars[0] ? pillars[0].id : null, noise: false })}
          className="flex-shrink-0 flex items-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium px-3 py-2 text-sm transition-colors"
        >
          <Plus size={15} /> {t("btn_add_block")}
        </button>
      </div>

      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 -mx-1 px-1 border-b border-slate-800">
        {schedules.map((s) => {
          const isActive = s.id === activeScheduleId;
          return (
            <div
              key={s.id}
              onClick={() => onSwitchSchedule(s.id)}
              className={`flex-shrink-0 flex items-center gap-1 pl-3 pr-1.5 py-2 rounded-t-lg cursor-pointer border-b-2 transition-colors ${
                isActive ? "border-sky-400 bg-slate-900/60" : "border-transparent hover:bg-slate-900/30"
              }`}
            >
              <span className={`text-xs whitespace-nowrap ${isActive ? "text-white font-medium" : "text-slate-400"}`}>
                {s.name}
                <span className="text-slate-600 ml-1.5 font-normal">{formatDateLabel(s.date)}</span>
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onEditSchedule(s.id); }}
                title={t("btn_edit_template")}
                className="p-1 rounded-full text-slate-600 hover:text-sky-300 hover:bg-slate-800 transition-colors"
              >
                <PenLine size={11} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDuplicateSchedule(s.id); }}
                title={t("btn_duplicate_template")}
                className="p-1 rounded-full text-slate-600 hover:text-sky-300 hover:bg-slate-800 transition-colors"
              >
                <Copy size={11} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); if (window.confirm(t("template_confirm_delete"))) onDeleteSchedule(s.id); }}
                title={t("btn_delete_template")}
                className="p-1 rounded-full text-slate-600 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              >
                <Trash2 size={11} />
              </button>
            </div>
          );
        })}
        <button
          onClick={onAddSchedule}
          title={t("btn_save_as_template")}
          className="flex-shrink-0 flex items-center gap-1 rounded-t-lg text-slate-500 hover:text-sky-300 hover:bg-slate-900/30 px-2.5 py-2 text-xs transition-colors"
        >
          <Plus size={13} />
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3 sm:p-4">
        <div className="relative flex" style={{ height: containerHeight }}>
          {/* hour rail */}
          <div className="relative flex-shrink-0 w-14 sm:w-16">
            {hourMarks.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 text-[11px] font-medium text-slate-600 -translate-y-1/2"
                style={{ top: ((h * 3600 - DAY_START_SEC) / totalSec) * containerHeight }}
              >
                {fmtClock(h)}
              </div>
            ))}
          </div>

          {/* continuous timeline */}
          <div ref={trackRef} className="relative flex-1 border-l border-slate-800/70">
            {hourMarks.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 border-t border-slate-800/50"
                style={{ top: ((h * 3600 - DAY_START_SEC) / totalSec) * containerHeight }}
              />
            ))}

            {sorted.map((b) => {
              const pillar = b.pillarId ? pillars.find((p) => p.id === b.pillarId) : null;
              const c = pillar ? swatch(pillar.color) : null;
              const rawTop = ((b.start - DAY_START_SEC) / totalSec) * containerHeight;
              const rawHeight = ((b.end - b.start) / totalSec) * containerHeight;
              // Defensive clamps — a block can never paint outside the track,
              // no matter what start/end values it happens to carry.
              const top = Math.max(0, Math.min(rawTop, containerHeight));
              const height = Math.max(Math.min(rawHeight, containerHeight - top), 3);
              const tiny = height < 30;
              const colorClass = b.noise
                ? "bg-slate-700/50 border-slate-500 border-dashed"
                : c
                ? `${c.bar} ${c.border} border-2`
                : "bg-slate-600 border-slate-400 border-2"; // fallback if the pillar was deleted
              // Tiêu Điểm can only start while the Dây Thời Gian is actually
              // over this block — not before it, not after it's passed.
              const isNow = now >= b.start && now < b.end;
              const isFuture = now < b.start;
              return (
                <div
                  key={b.id}
                  onClick={() => onEditBlock(b)}
                  className={`absolute left-1 right-1 rounded-lg cursor-pointer border overflow-hidden transition-transform hover:brightness-110 ${colorClass}`}
                  style={{ top, height }}
                  title={`${secToLabel(b.start)} – ${secToLabel(b.end)}${pillar ? " · " + pillar.name : ""}`}
                >
                  {!tiny && (
                    <div className="flex items-center justify-between h-full px-2 py-1 gap-1.5">
                      <div className="min-w-0">
                        <p className={`text-xs font-medium truncate ${b.noise ? "text-slate-300 italic" : "text-slate-950"}`}>
                          {b.noise ? t("noise_block_label") : pillar ? pillar.name : t("deleted_pillar_label")}
                        </p>
                        <p className={`text-[10px] ${b.noise ? "text-slate-500" : "text-slate-950/70"}`}>
                          {secToLabel(b.start)} – {secToLabel(b.end)}
                        </p>
                      </div>
                      {!b.noise && pillar && (
                        isNow ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); onStartFocus(b.pillarId); }}
                            className="flex-shrink-0 rounded-md bg-slate-950/25 hover:bg-slate-950/40 p-1"
                          >
                            <Play size={10} className="text-slate-950" />
                          </button>
                        ) : (
                          <span className="flex-shrink-0 rounded-md bg-slate-950/15 text-slate-950/50 px-1 py-0.5 text-[8px] font-medium leading-tight whitespace-nowrap">
                            {isFuture ? t("status_not_yet") : t("status_overdue")}
                          </span>
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {nowInRange && (
              <div className="absolute left-0 right-0 flex items-center gap-1.5 pointer-events-none z-10" style={{ top: nowTop }}>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 -ml-0.5" />
                <span className="flex-1 border-t border-rose-400/70" />
                <span className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-rose-950 bg-rose-400 -mr-1">
                  <Clock size={9} />
                  {t("now_line_label")} · {secToLabel(now)}
                </span>
              </div>
            )}

            {/* draggable end-of-day marker */}
            <div
              onPointerDown={(e) => { e.preventDefault(); setDragging(true); setDragPreview(dayEndSec); }}
              className="absolute left-0 right-0 flex items-center gap-1.5 cursor-ns-resize touch-none z-20 group"
              style={{ top: markerTop }}
            >
              <span className="flex-1 border-t-2 border-dashed border-orange-400/80" />
              <span className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-slate-950 bg-orange-400 -mr-1 ${dragging ? "" : "opacity-80 group-hover:opacity-100"}`}>
                <Settings2 size={9} />
                {secToLabel(markerSec)}
              </span>
            </div>

            {sorted.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-600 text-center px-6 pointer-events-none">
                {t("tb_empty")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const DURATION_PRESETS = [
  { label: "15p", sec: 15 * 60 },
  { label: "30p", sec: 30 * 60 },
  { label: "45p", sec: 45 * 60 },
  { label: "1g", sec: 60 * 60 },
  { label: "1g30", sec: 90 * 60 },
  { label: "2g", sec: 120 * 60 },
];

function StepBox({ value, onStep, onInput }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-slate-700 bg-slate-800/70 overflow-hidden select-none">
      <button type="button" onClick={() => onStep(1)} className="w-9 h-6 flex items-center justify-center text-slate-500 hover:text-sky-400 hover:bg-slate-700/60 active:bg-slate-700">
        <ChevronUp size={13} />
      </button>
      <input
        type="text" inputMode="numeric" value={pad2(value)}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(-2);
          if (digits === "") { onInput(0); return; }
          onInput(Number(digits));
        }}
        className="w-9 text-center text-base font-display font-semibold text-white bg-transparent py-0.5 focus:outline-none"
      />
      <button type="button" onClick={() => onStep(-1)} className="w-9 h-6 flex items-center justify-center text-slate-500 hover:text-sky-400 hover:bg-slate-700/60 active:bg-slate-700">
        <ChevronDown size={13} />
      </button>
    </div>
  );
}

function TimePicker({ label, sec, onChange, rightSlot, hint }) {
  const h = Math.floor(sec / 3600) % 24;
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);

  const set = (part, val) => {
    let hh = h, mm = m, ss = s;
    if (part === "h") hh = ((val % 24) + 24) % 24;
    if (part === "m") mm = ((val % 60) + 60) % 60;
    if (part === "s") ss = ((val % 60) + 60) % 60;
    onChange(hh * 3600 + mm * 60 + ss);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs text-slate-500">{label}</label>
        {rightSlot}
      </div>
      <div className="flex items-center gap-1">
        <StepBox value={h} onStep={(d) => set("h", h + d)} onInput={(v) => set("h", v)} />
        <span className="text-slate-500 font-display font-semibold">:</span>
        <StepBox value={m} onStep={(d) => set("m", m + d)} onInput={(v) => set("m", v)} />
        <span className="text-slate-500 font-display font-semibold">:</span>
        <StepBox value={s} onStep={(d) => set("s", s + d)} onInput={(v) => set("s", v)} />
        {hint && <span className="text-[10px] text-slate-600 ml-1">{hint}</span>}
      </div>
    </div>
  );
}

const MIN_BLOCK_SEC = 30 * 60;

function BlockModal({ mode, data, pillars, t, onClose, onSave, onDelete }) {
  const [start, setStart] = useState(data.start);
  const [end, setEnd] = useState(data.end);
  const [pillarId, setPillarId] = useState(data.noise ? null : data.pillarId);
  const [noise, setNoise] = useState(!!data.noise);
  const [error, setError] = useState("");

  const duration = end - start;

  const submit = () => {
    if (end <= start) { setError(t("err_end_before_start")); return; }
    if (duration < MIN_BLOCK_SEC) { setError(t("err_min_duration")); return; }
    if (!noise && !pillarId) { setError(t("err_select_pillar_or_noise")); return; }
    onSave({ id: data.id, start, end, pillarId: noise ? null : pillarId, noise });
  };

  return (
    <ModalShell onClose={onClose} title={mode === "add" ? t("block_add_title") : t("block_edit_title")}>
      <div className="space-y-4">
        <TimePicker
          label={t("field_start")}
          sec={start}
          onChange={(v) => { setStart(v); setError(""); }}
          hint={t("time_hms_hint")}
          rightSlot={
            <button
              onClick={() => { const n = nowSecOfDay(); setStart(n); if (end <= n) setEnd(Math.min(n + 1800, HARD_MAX_SEC)); setError(""); }}
              className="text-[11px] text-sky-400 hover:text-sky-300"
            >
              {t("btn_now")}
            </button>
          }
        />

        <TimePicker
          label={t("field_end")}
          sec={end}
          onChange={(v) => { setEnd(v); setError(""); }}
          rightSlot={
            <span className={`text-[11px] ${duration >= MIN_BLOCK_SEC ? "text-slate-500" : "text-rose-400"}`}>
              {duration > 0
                ? `${t("duration_prefix")} ${fmtMin(Math.round(duration / 60))}${duration < MIN_BLOCK_SEC ? " · " + t("duration_min_note") : ""}`
                : t("duration_invalid")}
            </span>
          }
        />

        <div className="flex flex-wrap gap-1.5">
          {DURATION_PRESETS.map((d) => (
            <button
              key={d.label}
              onClick={() => { setEnd(Math.min(start + d.sec, HARD_MAX_SEC)); setError(""); }}
              className="rounded-lg border border-slate-700 hover:border-sky-500/60 hover:text-sky-300 px-2.5 py-1 text-xs text-slate-400 transition-colors"
            >
              +{d.label}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1.5">{t("nav_pillars")}</label>
          <div className="space-y-1.5">
            {pillars.map((p) => {
              const c = swatch(p.color);
              const active = !noise && pillarId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => { setPillarId(p.id); setNoise(false); setError(""); }}
                  className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    active ? `border-slate-500 bg-slate-800` : "border-slate-800 bg-slate-900/60 hover:border-slate-600"
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                  <span className="text-sm text-slate-200 flex-1">{p.name}</span>
                  {active && <Check size={14} className="text-slate-300" />}
                </button>
              );
            })}
            <button
              onClick={() => { setNoise(true); setPillarId(null); setError(""); }}
              className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                noise ? "border-slate-500 bg-slate-800" : "border-dashed border-slate-700 hover:border-slate-500 text-slate-500 hover:text-slate-300"
              }`}
            >
              <Ban size={14} className="flex-shrink-0" />
              <span className="flex-1">
                <span className="block text-sm">{t("noise_block_label")}</span>
                <span className="block text-[11px] text-slate-600 mt-0.5">{t("noise_option_desc")}</span>
              </span>
              {noise && <Check size={14} className="text-slate-300 ml-auto flex-shrink-0 mt-0.5" />}
            </button>
          </div>
        </div>

        {error && <p className="text-xs text-rose-400">{error}</p>}

        <div className="flex gap-2">
          {mode === "edit" && (
            <button onClick={() => onDelete(data.id)} className="rounded-xl border border-slate-700 text-rose-400 hover:border-rose-500/50 px-4 py-2.5 text-sm transition-colors">
              <Trash2 size={15} />
            </button>
          )}
          <button onClick={submit} className="flex-1 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium py-2.5 text-sm transition-colors">
            {mode === "add" ? t("block_add_title") : t("pillar_btn_save_changes")}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function ScheduleModal({ mode, initialName, initialDate, t, onClose, onSave }) {
  const [name, setName] = useState(initialName || "");
  const [date, setDate] = useState(initialDate || todayStr());
  const [error, setError] = useState("");

  const submit = () => {
    if (!name.trim()) { setError(t("err_template_name_required")); return; }
    onSave(name.trim(), date);
  };

  const title = mode === "duplicate" ? t("template_modal_title_duplicate")
    : mode === "edit" ? t("template_modal_title_edit")
    : t("template_modal_title_new");

  return (
    <ModalShell onClose={onClose} title={title}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">{t("field_name")}</label>
          <input
            autoFocus
            value={name} onChange={(e) => { setName(e.target.value); setError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder={t("template_name_placeholder")}
            className="w-full rounded-xl bg-slate-800/70 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">{t("field_template_date")}</label>
          <input
            type="date"
            value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl bg-slate-800/70 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
          />
        </div>
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <button onClick={submit} className="w-full rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium py-2.5 text-sm transition-colors">
          {t("btn_save")}
        </button>
      </div>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Focus session (timer + buffer break)
// ---------------------------------------------------------------------------

function FocusSession({ session, pillar, saoChu, t, onToggle, onReset, onSkipBreak, onClose }) {
  const isBreak = session.phase === "break";
  const isDone = session.phase === "done";
  const total = isBreak ? 5 * 60 : 25 * 60;
  const pct = Math.round(((total - session.secondsLeft) / total) * 100);
  const mm = String(Math.floor(session.secondsLeft / 60)).padStart(2, "0");
  const ss = String(session.secondsLeft % 60).padStart(2, "0");
  const c = pillar ? swatch(pillar.color) : swatch("sky");

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/97 backdrop-blur-sm flex flex-col items-center justify-center px-6">
      <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-slate-200">
        <X size={22} />
      </button>

      {!isDone && (
        <>
          <div className="text-xs uppercase tracking-[0.25em] text-slate-500 mb-2">{isBreak ? t("focus_break_title") : `${t("focus_axis_prefix")} ${saoChu.name}`}</div>
          <div className="flex items-center gap-2 mb-8">
            {isBreak ? <Coffee size={20} className="text-orange-400" /> : <span className={`w-3 h-3 rounded-full ${c.dot}`} />}
            <h2 className="font-display text-2xl font-semibold text-white">{isBreak ? t("focus_break_heading") : pillar ? pillar.name : t("focus_label")}</h2>
          </div>

          <div className="relative w-64 h-64 flex items-center justify-center mb-8">
            <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
              <circle cx="100" cy="100" r="90" fill="none" stroke="#1e293b" strokeWidth="8" />
              <circle
                cx="100" cy="100" r="90" fill="none"
                stroke={isBreak ? "#f97316" : "#38bdf8"}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 90}
                strokeDashoffset={2 * Math.PI * 90 * (1 - pct / 100)}
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <span className="font-display text-5xl font-semibold text-white tabular-nums">{mm}:{ss}</span>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={onToggle} className="flex items-center gap-2 rounded-full bg-white text-slate-950 font-medium px-6 py-3 text-sm hover:bg-slate-200 transition-colors">
              {session.running ? <Pause size={16} /> : <Play size={16} />}
              {session.running ? t("btn_pause") : t("btn_resume")}
            </button>
            <button onClick={onReset} className="flex items-center gap-2 rounded-full border border-slate-700 text-slate-300 px-4 py-3 text-sm hover:border-slate-500 transition-colors">
              <RotateCcw size={15} />
            </button>
            {isBreak && (
              <button onClick={onSkipBreak} className="text-sm text-slate-500 hover:text-slate-300 px-3">
                {t("btn_skip_break")}
              </button>
            )}
          </div>
        </>
      )}

      {isDone && (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-emerald-400" />
          </div>
          <h2 className="font-display text-xl font-semibold text-white mb-1">{t("focus_done_title")}</h2>
          <p className="text-sm text-slate-500 mb-6">{t("focus_done_body_1")} {saoChu.name} {t("focus_done_body_2")} {pillar ? pillar.name : t("focus_this_session")}.</p>
          <button onClick={onClose} className="rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium px-6 py-2.5 text-sm transition-colors">
            {t("btn_close")}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pillars management view
// ---------------------------------------------------------------------------

function PillarsView({ pillars, logs, todayMinutes, t, onAdd, onEdit, onDelete }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{t("pillars_sub")}</p>
        <button onClick={onAdd} className="flex items-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium px-3.5 py-2 text-sm transition-colors">
          <Plus size={15} /> {t("btn_add_pillar")}
        </button>
      </div>

      <div className="space-y-2.5">
        {pillars.map((p) => {
          const c = swatch(p.color);
          const minutes = todayMinutes(p.id);
          const done = minutes >= p.target;
          return (
            <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${c.grad} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-white">{p.name}</h3>
                  {done && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <Check size={11} /> {t("card_done")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">{p.description || t("no_desc")}</p>
                <p className="text-xs text-slate-600 mt-0.5">{t("pillar_target_prefix")} {fmtMin(p.target)}/{t("per_day_suffix")} · {t("pillar_today_prefix")} {fmtMin(minutes)}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => onEdit(p)} className="p-2 rounded-lg text-slate-500 hover:text-sky-400 hover:bg-slate-800">
                  <PenLine size={15} />
                </button>
                <button onClick={() => onDelete(p.id)} className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
        {pillars.length === 0 && (
          <div className="text-center text-sm text-slate-500 py-10 border border-dashed border-slate-800 rounded-2xl">
            {t("pillars_empty")}
          </div>
        )}
      </div>
    </div>
  );
}

function PillarModal({ mode, data, t, onClose, onSave }) {
  const [name, setName] = useState(data.name || "");
  const [description, setDescription] = useState(data.description || "");
  const [color, setColor] = useState(data.color || "sky");
  const [target, setTarget] = useState(data.target || 30);
  const [error, setError] = useState("");

  const submit = () => {
    if (!name.trim()) { setError(t("err_name_required")); return; }
    if (!target || target < 30) { setError(t("err_target_min")); return; }
    onSave({ ...data, name: name.trim(), description: description.trim(), color, target: Number(target) });
  };

  return (
    <ModalShell onClose={onClose} title={mode === "add" ? t("pillar_add_title") : t("pillar_edit_title")}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">{t("field_name")}</label>
          <input
            value={name} onChange={(e) => { setName(e.target.value); setError(""); }}
            placeholder={t("pillar_name_placeholder")}
            className="w-full rounded-xl bg-slate-800/70 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">{t("field_desc")}</label>
          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder={t("pillar_desc_placeholder")}
            rows={2}
            className="w-full rounded-xl bg-slate-800/70 border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">{t("field_target")}</label>
          <input
            type="number" min={30} value={target} onChange={(e) => { setTarget(e.target.value); setError(""); }}
            className="w-full rounded-xl bg-slate-800/70 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">{t("field_color")}</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_SWATCHES.map((c) => (
              <button
                key={c.name} onClick={() => setColor(c.name)}
                className={`w-7 h-7 rounded-full ${c.dot} ${color === c.name ? `ring-2 ring-offset-2 ring-offset-slate-900 ${c.ring}` : "opacity-60"}`}
              />
            ))}
          </div>
        </div>
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <button onClick={submit} className="w-full rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium py-2.5 text-sm transition-colors">
          {mode === "add" ? t("btn_add_pillar") : t("pillar_btn_save_changes")}
        </button>
      </div>
    </ModalShell>
  );
}

function AbandonModal({ pillar, overallStreak, t, onCancel, onConfirm }) {
  const c = swatch(pillar.color);
  return (
    <ModalShell onClose={onCancel} title={t("abandon_title")}>
      <div className="flex items-start gap-3 rounded-xl bg-orange-500/10 border border-orange-500/30 p-3.5 mb-5">
        <AlertTriangle size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-orange-200/90 leading-relaxed">
          {t("abandon_warning_1")} "<span className="font-medium">{pillar.name}</span>" {t("abandon_warning_2")}
        </p>
      </div>
      {overallStreak > 0 && (
        <div className="flex items-center gap-2 mb-5 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2.5">
          <span className={`w-2 h-2 rounded-full ${c.dot}`} />
          <span className="text-sm text-slate-300">
            {t("abandon_streak_note_1")} <span className="font-medium text-white">{overallStreak} {t("achv_days_suffix")}</span> — {t("abandon_streak_note_2")} "{pillar.name}" {t("abandon_streak_note_3")}
          </span>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 rounded-xl border border-slate-700 text-slate-200 py-2.5 text-sm hover:border-slate-500 transition-colors">
          {t("btn_keep")}
        </button>
        <button onClick={onConfirm} className="flex-1 rounded-xl bg-rose-500/90 hover:bg-rose-500 text-white py-2.5 text-sm transition-colors">
          {t("btn_abandon")}
        </button>
      </div>
    </ModalShell>
  );
}

function SaoChuModal({ saoChu, dismissible = true, t, onClose, onSave }) {
  const [name, setName] = useState(saoChu.name);
  const [description, setDescription] = useState(saoChu.description);
  const [error, setError] = useState("");

  const submit = () => {
    if (!name.trim()) { setError(t("err_saochu_name_required")); return; }
    onSave({ name: name.trim(), description: description.trim() });
  };

  return (
    <ModalShell onClose={dismissible ? onClose : null} title={dismissible ? t("saochu_edit_title") : t("saochu_setup_title")}>
      <p className="text-xs text-slate-500 mb-4">
        {dismissible ? t("saochu_hint_edit") : t("saochu_hint_setup")}
      </p>
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">{t("field_name")}</label>
          <input
            value={name} onChange={(e) => { setName(e.target.value); setError(""); }}
            className="w-full rounded-xl bg-slate-800/70 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">{t("field_desc")}</label>
          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            className="w-full rounded-xl bg-slate-800/70 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 resize-none"
          />
        </div>
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <button onClick={submit} className="w-full rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium py-2.5 text-sm transition-colors">
          {t("btn_save")}
        </button>
      </div>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

function Analytics({ pillars, logs, noiseMinutesToday, streakRuns, t }) {
  const last7 = Array.from({ length: 7 }, (_, i) => dateStrDaysAgo(i));
  const weekTotals = pillars.map((p) => ({
    pillar: p, minutes: logs.filter((l) => l.pillarId === p.id && last7.includes(l.date)).reduce((s, l) => s + l.minutes, 0),
  }));
  const noiseWeek = logs.filter((l) => l.pillarId === "noise" && last7.includes(l.date)).reduce((s, l) => s + l.minutes, 0);
  const grandTotal = weekTotals.reduce((s, w) => s + w.minutes, 0) + noiseWeek;

  const currentStreak = currentStreakFromRuns(streakRuns);
  const history = sortStreakRunsByLength(streakRuns);
  const bestEver = history.length ? history[0].length : 0;
  const todayStatus = dailyPillarStatus(pillars, logs, todayStr());

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-display text-base font-semibold text-white mb-1">{t("analytics_time_title")}</h3>
        <p className="text-xs text-slate-500 mb-4">{t("analytics_time_sub")}</p>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex h-3 rounded-full overflow-hidden mb-4 bg-slate-800">
            {weekTotals.map(({ pillar, minutes }) => {
              const c = swatch(pillar.color);
              const pct = grandTotal ? (minutes / grandTotal) * 100 : 0;
              return <div key={pillar.id} className={c.bar} style={{ width: `${pct}%` }} title={pillar.name} />;
            })}
            {grandTotal > 0 && <div className="bg-slate-600" style={{ width: `${(noiseWeek / grandTotal) * 100}%` }} />}
          </div>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {weekTotals.map(({ pillar, minutes }) => {
              const c = swatch(pillar.color);
              const pct = grandTotal ? Math.round((minutes / grandTotal) * 100) : 0;
              return (
                <div key={pillar.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-300"><span className={`w-2 h-2 rounded-full ${c.dot}`} />{pillar.name}</span>
                  <span className="text-slate-500">{fmtMin(minutes)} · {pct}%</span>
                </div>
              );
            })}
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-400"><span className="w-2 h-2 rounded-full bg-slate-600" />{t("noise_block_label")}</span>
              <span className="text-slate-500">{fmtMin(noiseWeek)} · {grandTotal ? Math.round((noiseWeek / grandTotal) * 100) : 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- Thành Tích ---------------- */}
      <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent p-5 sm:p-6 space-y-7">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-amber-400" />
          <h3 className="font-display text-lg font-semibold text-white">{t("achv_title")}</h3>
        </div>

        {/* current streak hero */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-center">
          <p className="text-xs text-slate-500 mb-1">{t("achv_current_streak_label")}</p>
          <p className="font-display text-4xl font-bold text-white flex items-center justify-center gap-2">
            <Flame size={28} className="text-orange-400" />{currentStreak}
            <span className="text-base font-normal text-slate-500">{t("achv_days_suffix")}</span>
          </p>
          {bestEver > currentStreak && (
            <p className="text-xs text-slate-600 mt-1">{t("achv_best_ever_prefix")} {bestEver} {t("achv_days_suffix")}</p>
          )}
          <p className="text-xs text-slate-500 mt-3">{t("achv_rule_1")} <span className="text-slate-300">{t("achv_rule_all")}</span> {t("achv_rule_2")}</p>

          {pillars.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mt-4">
              {todayStatus.map((s) => {
                const c = swatch(s.pillar.color);
                return (
                  <span
                    key={s.pillar.id}
                    title={`${s.pillar.name}: ${fmtMin(s.minutes)} / ${fmtMin(s.pillar.target)}`}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] border ${
                      s.met ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-slate-700 bg-slate-800/60 text-slate-500"
                    }`}
                  >
                    {s.met ? <Check size={10} /> : <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />}
                    {s.pillar.name}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* trophy cabinet */}
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-1">{t("achv_trophy_title")}</h4>
          <p className="text-xs text-slate-500 mb-3">{t("achv_trophy_sub")}</p>
          <TrophyCabinet streakRuns={streakRuns} t={t} />
        </div>

        {/* streak history */}
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-1">{t("achv_history_title")}</h4>
          <p className="text-xs text-slate-500 mb-3">{t("achv_history_sub")}</p>
          {history.length === 0 ? (
            <div className="text-center text-sm text-slate-500 py-6 border border-dashed border-slate-800 rounded-2xl">
              {t("achv_history_empty")}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 divide-y divide-slate-800/70">
              {history.slice(0, 8).map((r, i) => (
                <div key={r.start} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="flex items-center gap-3 text-slate-400">
                    <span className="w-5 text-slate-600 font-display text-xs">#{i + 1}</span>
                    {fmtDateShort(r.start)} – {fmtDateShort(r.end)}
                  </span>
                  <span className="text-slate-200 font-medium">{r.length} {t("achv_days_suffix")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700/60 bg-slate-800/30 p-5">
        <div className="flex items-start gap-3">
          <Ban size={18} className="text-slate-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-white mb-1">{t("noise_today_title")}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {noiseMinutesToday > 0
                ? `${fmtMin(noiseMinutesToday)} ${t("noise_today_some")}`
                : t("noise_today_none")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrophyBadge({ tier, run, t }) {
  const Icon = tier.icon;
  const label = t(tier.labelKey);
  return (
    <div className="flex flex-col items-center text-center w-20" title={`${label} · ${run.length} ${t("achv_days_suffix")} · ${fmtDateShort(run.start)} – ${fmtDateShort(run.end)}`}>
      <div
        className={`rounded-full flex items-center justify-center ${tier.badge} ring-4 ${tier.ring} ${tier.glow ? "trophy-glow" : ""}`}
        style={{ width: tier.size, height: tier.size }}
      >
        <Icon size={Math.round(tier.size * 0.46)} className={tier.iconColor} />
      </div>
      <span className="text-[10px] text-slate-400 mt-1.5">{label}</span>
      <span className="text-[10px] text-slate-600">{run.length} {t("achv_days_suffix")}</span>
    </div>
  );
}

function TrophyCabinet({ streakRuns, t }) {
  const all = computeOverallTrophies(streakRuns);
  const tierRank = { year: 0, month: 1, week: 2 };
  all.sort((a, b) => tierRank[a.trophy.id] - tierRank[b.trophy.id] || b.length - a.length);

  if (all.length === 0) {
    return (
      <div className="text-center text-sm text-slate-500 py-8 border border-dashed border-slate-800 rounded-2xl">
        {t("trophy_empty_msg")}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
      <div className="flex flex-wrap gap-x-4 gap-y-5 justify-center sm:justify-start">
        {all.map((r) => (
          <TrophyBadge key={r.start} tier={r.trophy} run={r} t={t} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal shell
// ---------------------------------------------------------------------------

function LanguageModal({ lang, t, onClose, onPick }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = LANGUAGES.filter((l) =>
    !q || l.name.toLowerCase().includes(q) || l.native.toLowerCase().includes(q) || l.code.includes(q)
  );

  return (
    <ModalShell onClose={onClose} title={t("lang_label")}>
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("lang_search")}
          className="w-full rounded-xl bg-slate-800/70 border border-slate-700 pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
      </div>
      <div className="max-h-80 overflow-y-auto space-y-1 -mx-1 px-1">
        {filtered.map((l) => {
          const active = l.code === lang;
          return (
            <button
              key={l.code}
              onClick={() => onPick(l.code)}
              className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                active ? "border-slate-500 bg-slate-800" : "border-slate-800 bg-slate-900/60 hover:border-slate-600"
              }`}
            >
              <span className="text-lg leading-none">{l.flag}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm text-slate-200">{l.native}</span>
                <span className="block text-[11px] text-slate-500">{l.name}</span>
              </span>
              {active && <Check size={14} className="text-slate-300 flex-shrink-0" />}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-slate-500 py-8">—</p>
        )}
      </div>
    </ModalShell>
  );
}

function AuthModal({ t, activeProfile, onClose, onLogin, onRegister, onLogout }) {
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (activeProfile) {
    return (
      <ModalShell onClose={onClose} title={t("account_label")}>
        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 mb-5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-orange-400 flex items-center justify-center flex-shrink-0">
            <User size={16} className="text-slate-950" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">{t("auth_welcome")}</p>
            <p className="text-sm text-white truncate">{activeProfile}</p>
          </div>
        </div>
        <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 hover:border-rose-500/50 text-rose-400 font-medium py-2.5 text-sm transition-colors">
          <LogOut size={15} /> {t("auth_logout_btn")}
        </button>
      </ModalShell>
    );
  }

  const submit = async () => {
    setError("");
    if (!email.trim() || !password) { setError(t("auth_error_fields")); return; }
    setBusy(true);
    const err = mode === "login"
      ? await onLogin(email.trim().toLowerCase(), password)
      : await onRegister(email.trim().toLowerCase(), password);
    setBusy(false);
    if (err) setError(err);
    else onClose();
  };

  return (
    <ModalShell onClose={onClose} title={mode === "login" ? t("auth_login_title") : t("auth_register_title")}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">{t("auth_email")}</label>
          <input
            type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
            className="w-full rounded-xl bg-slate-800/70 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">{t("auth_password")}</label>
          <input
            type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
            className="w-full rounded-xl bg-slate-800/70 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
          />
        </div>
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <button
          onClick={submit}
          disabled={busy}
          className="w-full rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-slate-950 font-medium py-2.5 text-sm transition-colors"
        >
          {mode === "login" ? t("auth_login_btn") : t("auth_register_btn")}
        </button>
        <button
          onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
          className="w-full text-center text-xs text-sky-400 hover:text-sky-300"
        >
          {mode === "login" ? t("auth_switch_to_register") : t("auth_switch_to_login")}
        </button>
        <button onClick={onClose} className="w-full text-center text-xs text-slate-500 hover:text-slate-300">
          {t("auth_guest_btn")}
        </button>
        <p className="text-[11px] text-slate-600 leading-relaxed pt-1 border-t border-slate-800">{t("auth_note")}</p>
      </div>
    </ModalShell>
  );
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-base font-semibold text-white">{title}</h3>
          {onClose && <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X size={18} /></button>}
        </div>
        {children}
      </div>
    </div>
  );
}
