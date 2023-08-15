/*
 * @Author: gaiwa gaiwa@163.com
 * @Date: 2023-08-11 17:49:29
 * @LastEditors: gaiwa gaiwa@163.com
 * @LastEditTime: 2023-08-11 17:50:47
 * @FilePath: \html\work\js\game\js\common.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
function setStyle(dom, css){
  for (let key in css){
    dom['style'][key] = css[key];
  }
}

