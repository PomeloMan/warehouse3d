export interface GeoJson {
  /**
   * This describes the type of GeoJson geometry, Feature, or FeatureCollection this object is.
   * Every GeoJson Object will have this defined once an instance is created and will never return
   * null.
   *
   * @return a String which describes the type of geometry, for this object it will always return
   */
  type: string;
}