/**
 * テスト用の「必要な項目だけ書いた」教材データを、本物の型として渡すための目印。
 *
 * 教材の型（Problem / SubQuestion / AudioTrack）は必須項目が多く、
 * 判定関数のテストで毎回すべて書くと、何を確かめたいテストなのかが読めなくなる。
 * そこで「この値は意図的に一部だけ書いた見本」だと明示してから型を合わせる。
 * `as any` と違い、受け取る側の型（T）はそのまま検査される。
 */
export function fixture<T>(partial: NoInfer<Partial<T>> | Record<string, unknown>): T {
  return partial as T;
}
