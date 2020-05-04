// npm i -D loader-utils
const { getOptions } = require('loader-utils');
// npm i -D schema-utils
const validate = require('schema-utils');
const md5 = require('md5-node');
const compiler = require('vue-template-compiler')


// const cheerio = require('cheerio')
const generator = require("@babel/generator");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse");
const types = require("@babel/types");

const TemplateTransform = require('../utilty/vue-template-transform')

 
const schema = {
  'type': 'object',
  'properties': {
    'test': {
      'type': "string"
    }
  }
}
function generateScript(tableRefs, options = {existsTag: true}){

  let result = '';
  if(!Array.isArray(tableRefs) || tableRefs.length === 0){
    // return result;
    return parser.parse(result);
  }

  tableRefs.map(val => {
    if(val.ref != ''){
      result += 'this.$refs.' + val.ref + '.doLayout();\n';
    }
  })

  if (result !== '') {

    if(!options.existsTag){
      result = 'export default {\n\
       beforeUpdate() {\n\
        this.$nextTick(() => {\n'
       + result +
      '  })\n\
        } \n\
      } ';
    }
  }
  // console.log(result)
  return result;
}
function generateExpression(tableRefs, options = {existsTag: true}){
  // console.log(result)
  return parser.parse(generateScript(tableRefs,options));
}

module.exports = function(source) {
   // 在这里写转换 source 的逻辑 ...
  const parsed = compiler.parseComponent(source);
  // console.log(parsed);
  const { ast } = compiler.compile(parsed.template.content);
  // console.log(compiler.compile(parsed.template.content).ast);
  // console.log(parsed.template.script);
  // compile(this.code).ast

  // const TemplateTransform = require('vue-template-transformer')
  // const templateTransformer = new TemplateTransform()

// // extend the base template transform
// class NewTemplateTransform extends TemplateTransform {
//   genVIf (node) {
//     // do something for v-if directive
//   },
//   genVFor (node) {
//     // do something for v-for directive
//   }
// }

// // get an instance
// const newTemplateTranformer = new NewTemplateTransform({
//   // some options
//   prefix: 'foo'
// })

// inject the origin vue template ast and call generate method of transformer instance to get the transformed template
// const { code } = templateTransformer.generate(ast)
// console.log(code)
// console.log(ast)


  const options = getOptions(this);
 
  const regTag = /<el-table\s/g
  
  const regT = /<template>([\s\S]*)<\/template>/g

  // 模板处理块
  if (regT.test(source) === false) {
    return source;
  }

  const htmlString = RegExp.$1;
  let newString = htmlString;
  

  let props = ''
  // let matchContent =''
  
  let index = 0;
  //先去除注释的html标签
  const comments = [];
  const regComment = /<!--[\s\S]*?-->/;
  while(regComment.test(newString)) {
    index++;
    let matchContent = RegExp.lastMatch;
    const hastag = md5(matchContent +` comment_${index}`);
    const obj = {
      origin: matchContent,
      replaceMark: '\$el\$' + hastag + index
    }
    newString = newString.replace(obj.origin, obj.replaceMark);
    comments.push(obj);
  }

  const regTable = /<el-table(\s+[^>]*?show\-summary[^>]*?)>/
  const regShow = /(\sshow\-summary\s|\s:show\-summary="true"\s)/
  const regRef = /\sref="([^"]+)"\s/

  const tableRefs = [];
  index =0;
  let ref=''
  while(regTable.test(newString)) {
    index++;
    props = RegExp.$1
    let matchContent = RegExp.lastMatch;
    const hastag = md5(matchContent +` eltable_${index}`);
    const obj = {
      origin: matchContent,
      replaceMark: '\$el\$' + hastag + index,
      newString: RegExp.lastMatch,
      ref: ''
    }
    newString = newString.replace(obj.origin, obj.replaceMark)

    ref = '';
    if(regShow.test(props)) {
      if(!regRef.test(props)){
        ref = `eltable_${hastag}`
        props += `\nref="${ref}" `
      }else{
        ref = RegExp.$1;
      }
    }
    if(ref !== ''){
      obj.ref = ref;
      obj.newString = `<el-table${props}>`
    }
    tableRefs.push(obj)
  }

  if(tableRefs.length === 0) {
    return source;
  }
  tableRefs.map(val => {
    newString = newString.replace(val.replaceMark, val.newString)
  })
  comments.map(val => {
    newString = newString.replace(val.replaceMark, val.origin)
  })

  let newTemplate = '<template>' + newString + '</template>'
  console.log(newTemplate)
  source = source.replace(regT, newTemplate)


  // 脚本处理块
  const regS = /<script>([\s\S]*)<\/script>/g
  newString = ''
  // console.log(regS.test(source))
  if(!regS.test(source)){
    newString = generateScript(tableRefs, {existsTag: false})
    newTemplate = '\n<script>' + newString + '</script>';
    source = source + newTemplate;
  }else{
    //**正则已实现但不完整 */
    // const scriptString = RegExp.$1;
    // 
    // const regBeforeUpdate = /\sbeforeUpdate\(\)\s*\{([^}]*?)\}/g
    // if(regBeforeUpdate.test(scriptString)){

    // }

    // tableRefs.map(val => {
    //   if(val.ref !== ''){
    //     newString += 'this.$refs.' + val.ref + '.doLayout();\n';
    //   }
    //   // console.log(newString)
    // })
    // if (newString !== '') {
    //   newString = ' beforeUpdate() { \n \
    //     this.$nextTick(() => {  \n '
    //    + newString +
    //   '  }) \n \
    //   } ';
    //   const regexport =  /export\s+default\s+\{/;
    //   regexport.test(scriptString)
    //   const exportString = RegExp.lastMatch;
    //   // console.log(exportString)
    //   newString = exportString + '\n' + newString +',\n';
    //   newString = scriptString.replace(exportString, newString)
    //   newTemplate = '<script>' + newString + '</script>';
    //   // console.log(newTemplate)
    //   source = source.replace(regS, newTemplate)
    // }
    // 正则End
    const scriptString = RegExp.$1;
    
    function compile(code) {
      // 1.parse 将代码解析为抽象语法树（AST）
      const options = {
        // allowImportExportEverywhere: true,
        sourceType: 'module'
      }
      const ast = parser.parse(code, options);
    
      // 2,traverse 转换代码
      
      // 是否存在 export default语句
      let hasExportDefaultDeclaration = false;
      // 定义访问者
      let visitor = {
        ExportDefaultDeclaration(path){
          hasExportDefaultDeclaration = true;
        }
      }
      traverse.default(ast, visitor);
      if(!hasExportDefaultDeclaration){
        return generateScript(tableRefs, {existsTag: false}) + '\n' + code;
      }else{

        visitor = {
          ObjectExpression(path) {
            // console.log(types.isExportDefaultDeclaration(path.parent))
            if(!types.isExportDefaultDeclaration(path.parent)){
              return
            }
            // console.log(path.parent)
            
            let properties = path.node.properties;
            // console.log(typeof properties,properties.length);
            let fntNode = null;
            for(let i=0; i < properties.length; i++){
              if(properties[i].type === 'ObjectMethod' && properties[i].kind === 'method' && properties[i].key.name === 'beforeUpdate'){
                fntNode = properties[i];
                break;
              }
            }
            const injectExpression = generateExpression(tableRefs, {existsTag: true})
            // console.log(typeof injectExpression.program.body);
            // console.log(injectExpression);
            // 不存在 beforeUpdate时
            if(fntNode === null){
              // let injectExpression = parser.parse(injectCode);
              let expression = types.objectMethod("method", types.identifier('beforeUpdate'), [], types.blockStatement(injectExpression.program.body, []), false, false, false);
              // console.log(expression)
              properties.unshift(expression);
            }else{
              // console.log(fntNode)
              fntNode.body.body.unshift(injectExpression);
            }
          }
        }
        traverse.default(ast, visitor);
      
        // 3. generator 将 AST 转回成代码
        return generator.default(ast, {}, code).code;
      }
    }
    newString = compile(scriptString);

    // console.log(newString)
    newTemplate = '<script>\n' + newString + '\n</script>';
    source = source.replace(regS, newTemplate);
  }

    // console.log(source)
  return source;
};
