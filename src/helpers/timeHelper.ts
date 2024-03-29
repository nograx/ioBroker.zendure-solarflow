export const toHoursAndMinutes = (totalMinutes: number): string => {
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	return `${hours}h ${("00" + minutes).slice(-2)}m`;
};
