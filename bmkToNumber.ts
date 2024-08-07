export function bmkToNumber(str: string): number {
    const suffixes = { 'K': 1e3, 'M': 1e6, 'B': 1e9 };
    const regex = /^(\d+(\.\d+)?)([KMB])$/;
    const match = str.match(regex);

    if (match) {
        const number = parseFloat(match[1]);
        const suffix = match[3];
        return number * (suffixes[suffix as 'K' | 'B' | 'M'] || 1);
    }

    return NaN; // Return NaN if the input string is not in the expected format
}


// Example usage:
// console.log(bmkToNumber("2.26M")); // 2260000
// console.log(bmkToNumber("1.5K"));  // 1500
// console.log(bmkToNumber("3B"));    // 