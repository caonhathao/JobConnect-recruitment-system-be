const TYPE = { failed: "FAILED", success: "SUCCESS" };
/**
 *
 * @param {string} type
 * @param {String} message
 * @returns {Record<String,String>}
 */
const messageResponse = (type, message) => {
  return {
    type: type,
    message: message,
  };
};
module.exports = { TYPE, messageResponse };