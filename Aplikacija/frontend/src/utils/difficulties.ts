export default [
    "Piece of Cake",
    "Very Easy",
    "Easy",
    "Not too Easy",
    "Medium",
    "A Bit Hard",
    "Hard",
    "Too Hard",
    "Extremely Hard",
    "Insane"
];

const getColor = (val: number) => {
    if (val < 3) return 'success.main';
    if (val < 7) return 'warning.main';
    return 'error.main';
};

const getColorHex = (val: number) => {
    if (val < 3) return '#66bb6a';
    if (val < 7) return '#ffa726';
    return '#f44336';
};

export { getColor, getColorHex };