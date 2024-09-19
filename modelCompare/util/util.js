// 将数字保留2为百分数
function formatPercentage(value) {
  return (value * 100).toFixed(2) + '%';
}

export { formatPercentage };
