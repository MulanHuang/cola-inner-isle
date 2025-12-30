// 🎨 TabBar 图标组件
Component({
  properties: {
    // 图标名称：home | chat | meditation | profile
    name: {
      type: String,
      value: "home",
    },
    // 是否选中
    active: {
      type: Boolean,
      value: false,
    },
  },
});
