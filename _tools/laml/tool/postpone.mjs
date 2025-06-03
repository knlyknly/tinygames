/**
 * <pre>
 * For example:
 *  let timer = postpone(1000, again=>{
 *    // TODO add item to list
 *    again(2000); 
 *    return { release: ()=>{
 *      // TODO remove item to list
 *    }}
 *  });
 * This example add items to list, the first item will be add in 1 second, and then add a item each 2 seconds.
 * When the timer is not needed any more, call `timer.release()`
 * And all the added items will be removed from the list.
 * </pre>
 * 
 * @param {Number} delay delay in milliseconds
 * @param {Function} callback 
 *  The 'callback' function: (again)=>resource
 *  The 'again' argument: function to be called to redo the timer
 *  The 'again' function: (delay2=delay)=>void
 *  The 'delay' argument: defaultly equal to 'delay', or specify the delay of next call of 'callback'.
 *  The 'resource' result: A resource which should be released when the timer get released
 * @returns 
 */
const postpone = (delay, callback) => {
  let handler = null, resources = [];
  const again = delay2 => {
    handler = setTimeout(() => {
      clearTimeout(handler);
      handler = null;
      var resource = callback(again);
      if (resource && typeof resource.release === 'function') {
        resources.push(resource);
      }
    }, delay2 >= 0 ? delay2 : delay);
  };
  const release = () => {
    handler && clearTimeout(handler);
    handler = null;
    while (resources.length) {
      let resource = resources.pop();
      if (resource && typeof resource.release === 'function') {
        resource.release();
      }
    }
  };
  again(delay);
  return { get release() { return release(); } }
};

export default postpone;