
// French Color Names
// Simple Euclidean Distance for Nearest Neighbor

const colorNames = {
    // Greys
    "#000000": "Noir",
    "#2F4F4F": "Gris Ardoise Foncé",
    "#708090": "Gris Ardoise",
    "#778899": "Gris Ardoise Clair",
    "#696969": "Gris Foncé",
    "#808080": "Gris",
    "#A9A9A9": "Gris Moyen",
    "#C0C0C0": "Argent",
    "#D3D3D3": "Gris Clair",
    "#DCDCDC": "Gainsboro",
    "#F5F5F5": "Blanc Fumé",
    "#FFFFFF": "Blanc",

    // Reds
    "#800000": "Maroon",
    "#8B0000": "Rouge Foncé",
    "#A52A2A": "Brun",
    "#B22222": "Brique",
    "#DC143C": "Cramoisi",
    "#FF0000": "Rouge",
    "#FF6347": "Tomate",
    "#FF7F50": "Corail",
    "#CD5C5C": "Rouge Indien",
    "#F08080": "Corail Clair",
    "#E9967A": "Saumon Foncé",
    "#FA8072": "Saumon",
    "#FFA07A": "Saumon Clair",

    // Oranges
    "#FF4500": "Rouge Orange",
    "#FF8C00": "Orange Foncé",
    "#FFA500": "Orange",
    "#FFD700": "Or",
    "#FFFF00": "Jaune",
    "#FFFFE0": "Jaune Clair",
    "#FFFACD": "Chiffon Citron",
    "#FAFAD2": "Or Clair",
    "#FFEFD5": "Papaye",
    "#FFE4B5": "Mocassin",
    "#FFDAB9": "Pêche",
    "#EEE8AA": "Goldenrod Pâle",
    "#F0E68C": "Kaki",
    "#BDB76B": "Kaki Foncé",

    // Greens
    "#556B2F": "Olive Foncé",
    "#808000": "Olive",
    "#6B8E23": "Olive Drab",
    "#9ACD32": "Jaune Vert",
    "#32CD32": "Vert Citron",
    "#00FF00": "Citron",
    "#228B22": "Vert Forêt",
    "#008000": "Vert",
    "#006400": "Vert Foncé",
    "#7FFF00": "Chartreuse",
    "#7CFC00": "Vert Pelouse",
    "#ADFF2F": "Vert Jaune",
    "#90EE90": "Vert Clair",
    "#98FB98": "Vert Pâle",
    "#8FBC8F": "Vert Mer Foncé",
    "#00FA9A": "Vert Printemps Moyen",
    "#00FF7F": "Vert Printemps",
    "#2E8B57": "Vert Mer",
    "#3CB371": "Vert Mer Moyen",
    "#20B2AA": "Vert Mer Clair",
    "#66CDAA": "Aigue-marine Moyen",
    "#7FFFD4": "Aigue-marine",

    // Cyans / Blues
    "#008080": "Sarcelle",
    "#008B8B": "Cyan Foncé",
    "#00FFFF": "Cyan",
    "#E0FFFF": "Cyan Clair",
    "#AFEEEE": "Turquoise Pâle",
    "#40E0D0": "Turquoise",
    "#48D1CC": "Turquoise Moyen",
    "#00CED1": "Turquoise Foncé",
    "#5F9EA0": "Bleu Cadet",
    "#4682B4": "Bleu Acier",
    "#B0C4DE": "Bleu Acier Clair",
    "#B0E0E6": "Bleu Poudre",
    "#ADD8E6": "Bleu Clair",
    "#87CEEB": "Bleu Ciel",
    "#87CEFA": "Bleu Ciel Clair",
    "#00BFFF": "Bleu Ciel Profond",
    "#1E90FF": "Bleu Dodger",
    "#6495ED": "Bleuuet",
    "#4169E1": "Bleu Royal",
    "#0000FF": "Bleu",
    "#0000CD": "Bleu Moyen",
    "#00008B": "Bleu Foncé",
    "#000080": "Marine",
    "#191970": "Bleu Minuit",

    // Purples
    "#FFF0F5": "Lavande Rougir",
    "#D8BFD8": "Chardon",
    "#DDA0DD": "Prune",
    "#EE82EE": "Violet",
    "#DA70D6": "Orchidée",
    "#FF00FF": "Magenta",
    "#BA55D3": "Orchidée Moyen",
    "#9370DB": "Violet Moyen",
    "#8A2BE2": "Bleu Violet",
    "#9400D3": "Violet Foncé",
    "#9932CC": "Orchidée Foncé",
    "#8B008B": "Magenta Foncé",
    "#800080": "Pourpre",
    "#4B0082": "Indigo",
    "#483D8B": "Bleu Ardoise Foncé",
    "#6A5ACD": "Bleu Ardoise",
    "#7B68EE": "Bleu Ardoise Moyen",

    // Pinks
    "#FFC0CB": "Rose",
    "#FFB6C1": "Rose Clair",
    "#FF69B4": "Rose Vif",
    "#FF1493": "Rose Profond",
    "#C71585": "Violet Moyen Rouge",
    "#DB7093": "Violet Rouge Pâle",

    // Browns
    "#FFF8DC": "Soie de Maïs",
    "#FFEBCD": "Amande Blanchie",
    "#FFE4C4": "Bisque",
    "#FFDEAD": "Blanc Navajo",
    "#F5DEB3": "Blé",
    "#DEB887": "Bois Burly",
    "#D2B48C": "Bronzage",
    "#BC8F8F": "Brun Rosé",
    "#F4A460": "Brun Sable",
    "#DAA520": "Goldenrod",
    "#B8860B": "Goldenrod Foncé",
    "#CD853F": "Pérou",
    "#D2691E": "Chocolat",
    "#8B4513": "Brun Selle",
    "#A0522D": "Sienne",
    "#A52A2A": "Brun",
    "#800000": "Maroon"
};

const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

// Calculate Euclidean distance between two colors
const colorDistance = (hex1, hex2) => {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    if (!rgb1 || !rgb2) return Infinity;
    return Math.sqrt(
        Math.pow(rgb1.r - rgb2.r, 2) +
        Math.pow(rgb1.g - rgb2.g, 2) +
        Math.pow(rgb1.b - rgb2.b, 2)
    );
};

export const getColorName = (hex) => {
    // 1. Exact Match
    if (colorNames[hex.toUpperCase()]) {
        return colorNames[hex.toUpperCase()];
    }

    // 2. Nearest Match
    let closestColor = "Noir";
    let minDistance = Infinity;

    Object.keys(colorNames).forEach((key) => {
        const distance = colorDistance(hex, key);
        if (distance < minDistance) {
            minDistance = distance;
            closestColor = colorNames[key];
        }
    });

    return closestColor; // No more "(Similar)"
};
