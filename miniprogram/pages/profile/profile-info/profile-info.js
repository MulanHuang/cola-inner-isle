// pages/profile/profile-info/profile-info.js
const { calculateZodiac } = require("../../../utils/userProfile");
const db = wx.cloud.database();

const DEFAULT_DATETIME = {
  year: 2000,
  month: 1,
  day: 1,
  hour: 12,
  minute: 0,
};
Page({
  data: {
    // 性别选择
    gender: "",

    // 出生日期时间
    birthDate: "",
    birthTime: "",

    // 出生地点
    birthPlace: "",
    birthPlaceArray: [],

    // 现居地
    livePlace: "",
    livePlaceArray: [],

    // 日期时间选择器相关
    showDateTimePicker: false,
    dateTimePickerTab: "date", // 'date' | 'time'

    // 日期选择器数据
    years: [],
    months: [],
    days: [],
    hours: [],
    minutes: [],

    // 当前选中的索引
    datePickerValue: [60, 0, 0], // 默认2000年
    timePickerValue: [12, 0], // 默认12:00

    // 临时选中值
    tempYear: DEFAULT_DATETIME.year,
    tempMonth: DEFAULT_DATETIME.month,
    tempDay: DEFAULT_DATETIME.day,
    tempHour: DEFAULT_DATETIME.hour,
    tempMinute: DEFAULT_DATETIME.minute,

    // 地区选择器相关
    showRegionPicker: false,
    regionPickerType: "", // 'birth' | 'live'
    regionLevel: 0, // 0=省, 1=市, 2=区
    regionBreadcrumb: [], // 已选择的层级
    regionList: [], // 当前显示的列表
    regionSelectedCodes: [], // 当前选中的编码，用于高亮
    regionListScrollIntoView: "",
    birthRegionCodes: [],
    liveRegionCodes: [],

    // 省市区数据（简化版）
    regionData: null,
  },

  onLoad() {
    this.initPickerData();
    this.loadCachedProfile();
    this.loadRegionData();
  },

  // 初始化选择器数据
  initPickerData() {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = 1940; i <= currentYear; i++) {
      years.push(i);
    }

    const months = [];
    for (let i = 1; i <= 12; i++) {
      months.push(i);
    }

    const days = [];
    for (let i = 1; i <= 31; i++) {
      days.push(i);
    }

    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i);
    }

    const minutes = [];
    for (let i = 0; i < 60; i++) {
      minutes.push(i);
    }

    this.setData({ years, months, days, hours, minutes });
  },

  // 加载省市区数据
  loadRegionData() {
    // 使用微信内置的省市区数据
    const regionData = require("../../../utils/region-data.js");
    this.setData({ regionData });
  },

  // 从本地缓存加载数据
  loadCachedProfile() {
    try {
      const gender = wx.getStorageSync("profile.gender") || "";
      const birth = wx.getStorageSync("profile.birth") || {};
      const birthPlace = wx.getStorageSync("profile.birthPlace") || {};
      const livePlace = wx.getStorageSync("profile.livePlace") || {};

      this.setData({
        gender,
        birthDate: birth.date || "",
        birthTime: birth.time || "",
        birthPlace: birthPlace.text || "",
        birthPlaceArray: birthPlace.array || [],
        birthRegionCodes: birthPlace.codes || [],
        livePlace: livePlace.text || "",
        livePlaceArray: livePlace.array || [],
        liveRegionCodes: livePlace.codes || [],
      });

      this.prepareDateTimeSelection(birth.date, birth.time);
    } catch (e) {
      console.error("加载缓存失败", e);
    }
  },

  // 根据已有数据或默认值准备滚动选择器
  prepareDateTimeSelection(birthDate, birthTime) {
    const { years, months, hours, minutes } = this.data;
    if (!years.length || !months.length || !hours.length || !minutes.length) {
      return;
    }

    const parsedDate = this.parseDateString(birthDate);
    const parsedTime = this.parseTimeString(birthTime);

    const year = years.includes(parsedDate.year)
      ? parsedDate.year
      : DEFAULT_DATETIME.year;
    const month = months.includes(parsedDate.month)
      ? parsedDate.month
      : DEFAULT_DATETIME.month;
    const day = this.getSafeDay(parsedDate.day, year, month);

    const hour = hours.includes(parsedTime.hour)
      ? parsedTime.hour
      : DEFAULT_DATETIME.hour;
    const minute = minutes.includes(parsedTime.minute)
      ? parsedTime.minute
      : DEFAULT_DATETIME.minute;

    const days = this.buildDays(year, month);
    const datePickerValue = [
      Math.max(0, years.indexOf(year)),
      Math.max(0, months.indexOf(month)),
      Math.max(0, day - 1),
    ];
    const timePickerValue = [
      Math.max(0, hours.indexOf(hour)),
      Math.max(0, minutes.indexOf(minute)),
    ];

    this.setData({
      days,
      datePickerValue,
      timePickerValue,
      tempYear: year,
      tempMonth: month,
      tempDay: day,
      tempHour: hour,
      tempMinute: minute,
    });
  },

  // 解析日期字符串，支持 "/" 和 "-" 分隔
  parseDateString(dateStr) {
    if (!dateStr) return { ...DEFAULT_DATETIME };
    const parts = dateStr.split(/[/-]/).map((n) => Number(n));
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
      return { ...DEFAULT_DATETIME };
    }
    return { year: parts[0], month: parts[1], day: parts[2] };
  },

  // 解析时间字符串
  parseTimeString(timeStr) {
    if (!timeStr) return { ...DEFAULT_DATETIME };
    const parts = timeStr.split(":").map((n) => Number(n));
    if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) {
      return { ...DEFAULT_DATETIME };
    }
    return { hour: parts[0], minute: parts[1] };
  },

  // 构建指定年月的天数数组
  buildDays(year, month) {
    const count = new Date(year, month, 0).getDate();
    const days = [];
    for (let i = 1; i <= count; i++) {
      days.push(i);
    }
    return days;
  },

  // 确保日期在当月有效
  getSafeDay(day, year, month) {
    const daysInMonth = new Date(year, month, 0).getDate();
    if (!day || day > daysInMonth) {
      return Math.min(DEFAULT_DATETIME.day, daysInMonth);
    }
    return day;
  },

  // 选择性别
  selectGender(e) {
    const gender = e.currentTarget.dataset.gender;
    this.setData({ gender });
    wx.setStorageSync("profile.gender", gender);
  },

  // 打开日期时间选择器
  openDateTimePicker() {
    this.prepareDateTimeSelection(this.data.birthDate, this.data.birthTime);
    this.setData({
      showDateTimePicker: true,
      dateTimePickerTab: "date",
    });
  },

  // 关闭日期时间选择器
  closeDateTimePicker() {
    this.setData({ showDateTimePicker: false });
  },

  // 切换日期/时间选项卡
  switchDateTimeTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ dateTimePickerTab: tab });
  },

  // 日期选择器滚动
  onDatePickerChange(e) {
    const value = e.detail.value;
    const { years, months } = this.data;
    const year = years[value[0]];
    const month = months[value[1]];

    // 更新天数
    const days = this.buildDays(year, month);
    const daysInMonth = days.length;

    let dayIndex = value[2];
    if (dayIndex >= daysInMonth) {
      dayIndex = daysInMonth - 1;
    }

    this.setData({
      days,
      datePickerValue: [value[0], value[1], dayIndex],
      tempYear: year,
      tempMonth: month,
      tempDay: days[dayIndex],
    });
  },

  // 时间选择器滚动
  onTimePickerChange(e) {
    const value = e.detail.value;
    const { hours, minutes } = this.data;
    this.setData({
      timePickerValue: value,
      tempHour: hours[value[0]],
      tempMinute: minutes[value[1]],
    });
  },

  // 日期时间选择下一步
  dateTimeNextStep() {
    if (this.data.dateTimePickerTab === "date") {
      this.setData({ dateTimePickerTab: "time" });
    } else {
      this.confirmDateTime();
    }
  },

  // 确认日期时间选择
  confirmDateTime() {
    const { tempYear, tempMonth, tempDay, tempHour, tempMinute } = this.data;
    const birthDate = `${tempYear}/${String(tempMonth).padStart(
      2,
      "0"
    )}/${String(tempDay).padStart(2, "0")}`;
    const birthTime = `${String(tempHour).padStart(2, "0")}:${String(
      tempMinute
    ).padStart(2, "0")}`;

    this.setData({
      birthDate,
      birthTime,
      showDateTimePicker: false,
    });

    wx.setStorageSync("profile.birth", { date: birthDate, time: birthTime });
  },

  // 打开地区选择器
  openRegionPicker(e) {
    const type = e.currentTarget.dataset.type;
    const { regionData } = this.data;

    if (!regionData) {
      wx.showToast({ title: "地区数据加载中", icon: "none" });
      return;
    }

    const cachedCodes =
      type === "birth" ? this.data.birthRegionCodes : this.data.liveRegionCodes;

    const prepared =
      cachedCodes && cachedCodes.length
        ? this.prepareRegionByCodes(cachedCodes)
        : {
            regionLevel: 0,
            regionBreadcrumb: [],
            regionList: regionData.provinces || [],
            regionSelectedCodes: [],
            regionListScrollIntoView: "",
          };

    this.setData({
      showRegionPicker: true,
      regionPickerType: type,
      ...prepared,
    });
  },

  // 关闭地区选择器
  closeRegionPicker() {
    this.setData({ showRegionPicker: false });
  },

  // 选择地区项
  selectRegionItem(e) {
    const item = e.currentTarget.dataset.item;
    const { regionLevel, regionBreadcrumb, regionData, regionPickerType } =
      this.data;

    // 添加触觉反馈
    wx.vibrateShort({ type: "light" });

    const newBreadcrumb = [...regionBreadcrumb, item];
    const regionSelectedCodes = [...this.data.regionSelectedCodes];
    regionSelectedCodes[regionLevel] = item.code;
    regionSelectedCodes.length = regionLevel + 1;

    if (regionLevel === 0) {
      // 选择了省，显示市列表
      const cities =
        regionData.cities[item.code] || this.createFallbackCities(item);
      if (cities.length > 0) {
        // 从列表第一项开始显示，使用第一个城市的 code 构建 scrollId
        const firstCityScrollId = this.buildScrollId(cities[0].code);
        this.setData({
          regionLevel: 1,
          regionBreadcrumb: newBreadcrumb,
          regionList: cities,
          regionSelectedCodes,
          regionListScrollIntoView: firstCityScrollId,
        });
      } else {
        this.finishRegionSelect(newBreadcrumb, regionSelectedCodes);
      }
    } else if (regionLevel === 1) {
      // 选择了市，显示区列表
      const districts =
        regionData.districts[item.code] ||
        this.createFallbackDistricts(item, regionBreadcrumb[0]);
      if (districts.length > 0) {
        // 从列表第一项开始显示，使用第一个区的 code 构建 scrollId
        const firstDistrictScrollId = this.buildScrollId(districts[0].code);
        this.setData({
          regionLevel: 2,
          regionBreadcrumb: newBreadcrumb,
          regionList: districts,
          regionSelectedCodes,
          regionListScrollIntoView: firstDistrictScrollId,
        });
      } else {
        this.finishRegionSelect(newBreadcrumb, regionSelectedCodes);
      }
    } else {
      // 选择了区，完成
      this.finishRegionSelect(newBreadcrumb, regionSelectedCodes);
    }
  },

  // 点击面包屑返回
  clickBreadcrumb(e) {
    const level = e.currentTarget.dataset.level;
    const { regionBreadcrumb, regionData } = this.data;

    if (level === -1) {
      // 返回省列表
      this.setData({
        regionLevel: 0,
        regionBreadcrumb: [],
        regionList: regionData.provinces || [],
        regionSelectedCodes: [],
        regionListScrollIntoView: "",
      });
    } else if (level === 0) {
      // 返回市列表
      const province = regionBreadcrumb[0];
      const cities =
        regionData.cities[province.code] || this.createFallbackCities(province);
      this.setData({
        regionLevel: 1,
        regionBreadcrumb: [province],
        regionList: cities,
        regionSelectedCodes: [province.code],
        regionListScrollIntoView: this.buildScrollId(
          this.data.regionSelectedCodes[1] || ""
        ),
      });
    }
  },

  // 完成地区选择
  finishRegionSelect(breadcrumb, regionSelectedCodes = []) {
    const { regionPickerType } = this.data;
    const names = breadcrumb.map((item) => item.name);
    const text = names.slice(1).join(" ") || names[0]; // 显示市+区，或只显示省

    const placeData = {
      text,
      array: names,
    };

    const codes = regionSelectedCodes.slice(0, breadcrumb.length);

    if (regionPickerType === "birth") {
      this.setData({
        birthPlace: text,
        birthPlaceArray: names,
        showRegionPicker: false,
        regionSelectedCodes,
        birthRegionCodes: codes,
      });
      wx.setStorageSync("profile.birthPlace", { ...placeData, codes });
    } else {
      this.setData({
        livePlace: text,
        livePlaceArray: names,
        showRegionPicker: false,
        regionSelectedCodes,
        liveRegionCodes: codes,
      });
      wx.setStorageSync("profile.livePlace", { ...placeData, codes });
    }
  },

  // 当下级为空时直接确认当前选择
  confirmCurrentRegion() {
    const { regionBreadcrumb } = this.data;
    if (!regionBreadcrumb.length) {
      wx.showToast({ title: "请先选择地区", icon: "none" });
      return;
    }
    this.finishRegionSelect(regionBreadcrumb, this.data.regionSelectedCodes);
  },

  // 构造缺省市级数据
  createFallbackCities(province) {
    if (!province) return [];
    const name = province.name || "全境";
    return [
      {
        code: `${province.code}01`,
        name: `${name}全境`,
      },
    ];
  },

  // 构造缺省区县数据
  createFallbackDistricts(city, province) {
    if (!city) return [];
    const cityName = city.name || "全境";
    const suffix = province && province.name ? province.name : "";
    return [
      {
        code: `${city.code}01`,
        name: `${cityName.replace(/市$/, "")}${suffix ? "" : "全境"}`,
      },
    ];
  },

  // 根据 codes 预装载选择路径
  prepareRegionByCodes(codes) {
    const { regionData } = this.data;
    if (!regionData) {
      return {
        regionLevel: 0,
        regionBreadcrumb: [],
        regionList: [],
        regionSelectedCodes: [],
        regionListScrollIntoView: "",
      };
    }

    const provinces = regionData.provinces || [];
    const province = provinces.find((p) => p.code === codes[0]);
    if (!province) {
      return {
        regionLevel: 0,
        regionBreadcrumb: [],
        regionList: provinces,
        regionSelectedCodes: [],
        regionListScrollIntoView: "",
      };
    }

    const breadcrumb = [province];
    const selectedCodes = [province.code];
    let regionLevel = 0;
    let regionList = provinces;
    let scrollId = this.buildScrollId(province.code);

    if (codes[1]) {
      const cityList =
        regionData.cities[province.code] || this.createFallbackCities(province);
      const city = cityList.find((c) => c.code === codes[1]);
      regionList = cityList;
      regionLevel = 1;
      if (city) {
        breadcrumb.push(city);
        selectedCodes[1] = city.code;
        scrollId = this.buildScrollId(city.code);
      } else {
        scrollId = this.buildScrollId(province.code);
      }

      if (codes[2]) {
        const districtList =
          (city && regionData.districts[city.code]) ||
          this.createFallbackDistricts(city, province);
        regionList = districtList;
        regionLevel = 2;
        const district = districtList.find((d) => d.code === codes[2]);
        if (district) {
          breadcrumb.push(district);
          selectedCodes[2] = district.code;
          scrollId = this.buildScrollId(district.code);
        }
      }
    }

    return {
      regionLevel,
      regionBreadcrumb: breadcrumb,
      regionList,
      regionSelectedCodes: selectedCodes,
      regionListScrollIntoView: scrollId,
    };
  },

  buildScrollId(code) {
    return code ? `region-item-${code}` : "";
  },

  // 点击完成按钮
  async handleComplete() {
    const { gender, birthDate, birthTime, birthPlaceArray, livePlaceArray } =
      this.data;

    // 校验必填项
    if (!gender) {
      wx.showToast({ title: "请选择性别", icon: "none" });
      return;
    }
    if (!birthDate) {
      wx.showToast({ title: "请选择出生日期", icon: "none" });
      return;
    }
    if (!birthTime) {
      wx.showToast({ title: "请选择出生时间", icon: "none" });
      return;
    }

    // 根据生日自动计算星座
    const zodiac = calculateZodiac(birthDate);

    // 打包数据并保存到本地
    const profile = {
      gender,
      birthDate,
      birthTime,
      birthPlace: birthPlaceArray,
      livePlace: livePlaceArray,
      zodiacId: zodiac?.id || "",
    };

    wx.setStorageSync("userProfile", profile);

    // 清除档案提示记录（用户已完善，无需再提示）
    wx.removeStorageSync("profilePromptRecord");

    // 同步到云数据库
    this.syncProfileToCloud(profile);

    wx.showToast({
      title: "保存成功",
      icon: "success",
      duration: 1500,
    });

    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  },

  // 同步个人档案到云数据库
  async syncProfileToCloud(profile) {
    try {
      const res = await db
        .collection("users")
        .where({ _openid: "{openid}" })
        .limit(1)
        .get();

      const cloudData = {
        gender: profile.gender,
        birthday: profile.birthDate,
        birthTime: profile.birthTime,
        zodiac: profile.zodiacId,
        birthPlace: profile.birthPlace,
        livePlace: profile.livePlace,
        updateTime: db.serverDate(),
      };

      if (res.data && res.data.length > 0) {
        await db
          .collection("users")
          .doc(res.data[0]._id)
          .update({ data: cloudData });
        console.log("[profile-info] ✅ 个人档案已同步到云数据库（更新）");
      } else {
        await db.collection("users").add({
          data: {
            ...cloudData,
            createTime: db.serverDate(),
          },
        });
        console.log("[profile-info] ✅ 个人档案已同步到云数据库（新增）");
      }
    } catch (err) {
      console.warn("[profile-info] ⚠️ 同步到云数据库失败", err);
      // 不阻断流程，本地已保存成功
    }
  },

  // 阻止事件冒泡
  preventBubble() {},
});
