export type AQICategory = 'Good' | 'Satisfactory' | 'Moderate' | 'Poor' | 'Very Poor' | 'Severe' | 'Unknown';

export function getAQICategory(value: number): AQICategory {
  if (value < 0) return 'Unknown';
  if (value <= 50) return 'Good';
  if (value <= 100) return 'Satisfactory';
  if (value <= 200) return 'Moderate';
  if (value <= 300) return 'Poor';
  if (value <= 400) return 'Very Poor';
  if (value <= 500) return 'Severe';
  return 'Severe'; // > 500 is still considered severe, typically
}

export function getAQIColor(value: number): string {
  const category = getAQICategory(value);
  switch (category) {
    case 'Good': return '#4CAF50';
    case 'Satisfactory': return '#8BC34A';
    case 'Moderate': return '#FFEB3B';
    case 'Poor': return '#FF9800';
    case 'Very Poor': return '#F44336';
    case 'Severe': return '#7E0023';
    default: return '#9E9E9E'; // Unknown or invalid
  }
}
