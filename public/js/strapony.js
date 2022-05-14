/*
    
    copyright 2019-2022 Hamzin Abdulla (abdulla_best@mail.ru)
*/

// глобальный объект в котором хранится структура
window.$ = {
    TPL: {},        // шаблоны
    _components:{}, // зарезервированная коллекция компанентов 
}

export const show = e=>e.el.style.display = 'block'
export const hide = e=>e.el.style.display = 'none'
export const isVisible = e=>e.el.style.display === 'block'
//   
class o {
    constructor(){
        this.el    = null
        this._call = null
        this._list = null
    }
    // добавляет шаблон в элемент
    set(id,a){
        if (this._list===null){
            this._list = new Map()
        }
        let b = a.el.cloneNode(false)
        a._call(b)
        b = b.content.firstElementChild
 
        let old_b = this._list.get(id)
        if (old_b!==undefined){
            this.el.replaceChild(b,old_b)
        }else{
            this.el.appendChild(b)
        }
        this._list.set(id,b)
        return b
    }
    // получаем элемент сгененрированный по шаблону
    get(id){
        if (this._list===null){ return null }
        let b = this._list.get(id)
        if (b===undefined){ return null }
        return b
    }
    // удаляет шаблон из элемента
    del(id){
        if (this._list!==null){
            let b = this._list.get(id)
            if (b!==undefined){
                b.parentNode.removeChild(b)
                this._list.delete(id)
            }
        }
    }
    // удаляет все созданные шаблоны
    clear(){
        if (this._list===null){return}
        for (let a of this._list){
           a[1].parentNode.removeChild(a[1])
           this._list.delete(a[0])
        }    
    }
}

export const prepare = new Promise((resolve,reject)=>{ // подготовка
    // проходим по все элементам dom дерева и собираем только с выставленным атрибутом id
    let component_list = []
    let component_count = 0
    let l = document.querySelectorAll('*[id]')
    for (let j=0;j<l.length;j++){
        let el = l[j]
        let a = window.$
        let s = el.id.split('.')   // разбиваем идентификатор на несколько
        if (s.length===0){ continue }
        // дополняем название, если встретили короткую запись до дополняем id до полной записи
        if (s[0].length===0){
            let parent = el.parentNode
            while (parent!==null){
                if (parent.id!==undefined && parent.id!=='' && parent.id[0]!=='.'){
                    el.id = parent.id + el.id
                    s = el.id.split('.')
                    break
                }
                parent = parent.parentNode
            }
        }
        let s2 = ''
        // обрабатываем шаблоны
        if (el.nodeName==='TEMPLATE'){
            a = window.$.TPL
            el.remove()  // убераем его из документа
            //el.removeAttribute('id')       // убераем атрибут id
            // заменяем кавычки на юникод
            //let s1 = (el.getAttribute('style')||'').replace(/`/g,'\\u0060').replace(/'/g,'\\u0027')
            s2 = el.innerHTML.replace(/`/g,'\\u0060').replace(/'/g,'\\u0027') 
            //el.removeAttribute('style')
        }
        // заполняем
        for (let i=0;i<s.length;i++){
            let name = s[i]
            let b = a[name]
            if (b===undefined){     
                b = new o()
                a[name] = b
            }
            a = b
        }
        a.el = el
        if (s2.length!==0){ 
            // создаем функцию шаблонизатора для достижения максимальной производительности
            a._call = new Function('d','d.innerHTML=`' + s2 + '`') //d.setAttribute("style",`' + s1 + '`);
        }
        // загружаем компоненты и запускаем их в работу
        const component = el.getAttribute('component')
        if (component){
            component_list.push(a)
            if (!window.$._components[component]){
                component_count = component_count + 1
                //
                let link  = document.createElement('link')
                link.href = '/css/'+component+'.css'
                link.type = 'text/css'
                link.rel  = 'stylesheet'
                document.getElementsByTagName('head')[0].appendChild(link)
                //
                window.$._components[component] = fetch('/component/'+component+'.js')
                .then(response=>response.text())
                .then(text=>{
                    window.$._components[component] = new Function('"use strict";'+text)
                }).catch(err=>{
                    console.log(err)
                }).finally(()=>{
                    component_count = component_count - 1
                    if (component_count===0){
                        component_list.forEach(obj=>{
                            const component = obj.el.getAttribute('component')
                            if (window.$._components[component]){
                                obj._component = window.$._components[component].bind(obj)
                                obj._component()
                            }
                        })
                        //
                        resolve()
                    }
                })
            }    
        }
    }
    if (component_count===0){
        resolve()
    }
})
