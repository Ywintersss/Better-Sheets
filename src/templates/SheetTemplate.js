/**
 *  @typedef {Object} SheetTemplateProps
 *
 *  @property {String} header
 *  @property {String} period (monthly / yearly)
 */

const SheetTemplate = (() => {
  const privateProps = new WeakMap();

  class SheetTemplate {
    /**
     *  Constructor
     *
     *  @param {SheetTemplateProps} props
     */

    constructor({ header, period }) {
      privateProps.set(this, { header, period });
    }

    // Getters

    /**
     * Gets the sheet's header
     *
     * @return {String}
     */

    getHeader() {
      return privateProps.get(this).header;
    }

    /**
     * Gets the timespan between each entry
     *
     * @return {String}
     */

    getPeriod() {
      return privateProps.get(this).period;
    }

    /**
     * Gets all sheet attributes
     *
     * @return {Object}
     */

    getSheetAttributes() {
      return { ...privateProps.get(this) };
    }

    //Setters

    /**
     * Sets the header of the sheet
     *
     * @params {String} header
     */

    setHeader(header) {
      privateProps.get(this).header = header;
    }

    /**
     * Sets the timespan between each entry
     *
     * @params {String} period
     */

    setPeriod(period) {
      privateProps.get(this).period = period;
    }

    /**
     * Sets all sheet attributes of a sheet
     *
     * @params {String} header
     * @params {String} period
     */

    setSheetAtrributes(header, period) {
      privateProps.get(this).header = header;
      privateProps.get(this).period = period;
    }
  }

  return SheetTemplate;
})();

export default SheetTemplate;
