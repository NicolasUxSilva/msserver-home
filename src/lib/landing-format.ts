/** Preço em reais a partir de centavos: 2350000 → "R$ 23.500". */
export const brl = (cents: number) => {
  const digits = cents % 100 === 0 ? 0 : 2;
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: digits, maximumFractionDigits: digits });
};
