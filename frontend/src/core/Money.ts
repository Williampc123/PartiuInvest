export class Money {
  private readonly cents: number;

  private constructor(cents: number) {
    this.cents = Math.round(cents);
  }

  public static fromCents(cents: number): Money {
    return new Money(cents);
  }

  public static fromReais(reais: number): Money {
    return new Money(reais * 100);
  }

  public toCents(): number {
    return this.cents;
  }

  public toReais(): number {
    return this.cents / 100;
  }

  public add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  public subtract(other: Money): Money {
    return new Money(this.cents - other.cents);
  }

  public formatBRL(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(this.cents / 100);
  }

  public static formatCents(cents: number): string {
    return new Money(cents).formatBRL();
  }
}
