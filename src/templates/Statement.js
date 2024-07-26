/**
 *  @typedef {Object} StatementProps
 *
 *  @property {String} header
 *  @property {String} title
 *  @property {String} period (monthly / yearly)
 *  @property {Object} revenueDetails
 *  @property {Object} expensesDetails
 */

const Statement = (() => {
  const privateProps = new WeakMap();

  class Statement extends SheetTemplate {
    /**
     *  Constructor
     *
     *  @param {StatementProps} props
     */

    constructor({ header, title, period, revenueDetails, expensesDetails }) {
      super({
        header: header,
        title: title,
        period: period,
      });
      privateProps.set(this, {
        header,
        title,
        period,
        revenueDetails,
        expensesDetails,
      });
    }

    //Getters

    /**
     * Gets the details for Revenue
     *
     * @return {Object}
     */

    getRevenueDetails() {
      return privateProps.get(this).revenueDetails;
    }

    /**
     * Gets the details for Expenses
     *
     * @return {Object}
     */

    getExpensesDetails() {
      return privateProps.get(this).expensesDetails;
    }

    /**
     * Gets all Statement attributes
     *
     * @return {Object}
     */

    getStatementAttributes() {
      return { ...privateProps.get(this) };
    }

    // Setters

    setRevenueDetails(revenueDetails) {
      privateProps.get(this).revenueDetails = revenueDetails;
    }

    setExpensesDetails(expensesDetails) {
      privateProps.get(this).expensesDetails = expensesDetails;
    }

    /**
     * Sets all Statement attributes of a Statement
     *
     * @params {String} header
     * @params {String} title
     * @params {String} period
     * @params {Object} revenueDetails
     * @params {Object} expensesDetails
     *
     */

    setStatementAtrributes(
      header,
      title,
      period,
      revenueDetails,
      expensesDetails
    ) {
      privateProps.get(this).header = header;
      privateProps.get(this).title = title;
      privateProps.get(this).period = period;
      privateProps.get(this).revenueDetails = revenueDetails;
      privateProps.get(this).expensesDetails = expensesDetails;
    }
  }

  return Statement;
})();
