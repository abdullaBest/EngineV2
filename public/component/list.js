const el = this.el
let selected = null

this.onselect = ()=>{}

this.clear = ()=>{
    el.innerHTML = ''
    selected = null
}

this.get_selected_id = ()=> {
    if (selected===null){
        return ''
    }   
    return selected.dataset.id
}

this.get_selected_level = ()=>{
    if (selected===null){
        return '0'
    }   
    return selected.dataset.l
}

const select = (e)=>{
    let id = e.target.dataset.id
    if (selected!==null){
        selected.style.backgroundColor = ''
    }
    selected = e.target
    selected.style.backgroundColor = 'blue'
    this.onselect(id)
}

this.add = (parent_id,id,name,color='white')=>{
    let l = 0
    let p = ''

    if (parent_id!==null){
        for (let i=0;i<el.children.length;i++){
            if (el.children[i].dataset.id===parent_id){
                p = parent_id
                l = parseInt(el.children[i].dataset.l)+1 
                break
            }
        }
    }

    let a = document.createElement('div')
    a.style.marginLeft = (l*4)+'px'
    a.style.color = color
    a.dataset.id  = id
    a.innerText   = name
    a.onclick     = select
    a.dataset.p   = p
    a.dataset.l   = l
    el.appendChild(a)
}

this.insert = (parent_id,id,name,color='white')=>{
    let l = 0
    let p = ''
    let _el = el

    for (let i=0;i<el.children.length;i++){
        if (el.children[i].dataset.id===parent_id){
            _el = el.children[i]
            p = parent_id
            l = parseInt(_el.dataset.l)+1 
            break
        }
    }

    const a = document.createElement('div')
    a.style.marginLeft = (l*4)+'px'
    a.style.color = color
    a.dataset.id  = id
    a.innerText   = name
    a.onclick     = select
    a.dataset.p   = p
    a.dataset.l   = l

    el.insertBefore(a,_el.nextSibling)
}

this.add_or_update = (parent_id,id,name,color='white')=>{
    let a = el.querySelector('[data-id="'+id+'"]')
    if (!a){
        this.add(parent_id,id,name,color)
    }else{
        a.innerText = name
    }
}

this.insert_or_update = (parent_id,id,name,color='white')=>{
    let a = el.querySelector('[data-id="'+id+'"]')
    if (!a){
        this.insert(parent_id,id,name,color)
    }else{
        a.innerText = name
    }
}

this.show_level = (l)=>{
    for (let i=0;i<el.children.length;i++){
        const level = parseInt(el.children[i].dataset.l)
        if (level==l){
            el.children[i].style.display = 'block'
        }
    }
}

this.hide_level = (l)=>{
    for (let i=0;i<el.children.length;i++){
        const level = parseInt(el.children[i].dataset.l)
        if (level==l){
            el.children[i].style.display = 'none'
        }
    }
}


this.show_group = (name)=>{
    const s = String(name)
    for (let i=0;i<el.children.length;i++){
        if (el.children[i].dataset.p===s){
            el.children[i].style.display = 'block'
        }
    }
}

this.hide_group = (name)=>{
    const s = String(name)
    for (let i=0;i<el.children.length;i++){
        if (el.children[i].dataset.p===s){
            el.children[i].style.display = 'none'
        }
    }
}

this.switch_visibility_group = (name)=>{
    const s = String(name)
    for (let i=0;i<el.children.length;i++){
        if (el.children[i].dataset.p===s){
            if (el.children[i].style.display==='none'){
                el.children[i].style.display = 'block'
            }else{
                el.children[i].style.display = 'none'
            }
        }
    }
}


this.delete = (id)=>{
    for (let i=0;i<el.children.length;i++){
        if (el.children[i].dataset.id===id){
            if (selected===el.children[i]){
                selected = null
            }
            el.children[i].remove()
            break
        }
    }
}

this.update = (id,name)=>{
    let a = el.querySelector('[data-id="'+id+'"]')
    if (!a){
        return
    }
    a.innerText = name
}
this.select = (id)=>{
    let a = el.querySelector('[data-id="'+id+'"]')
    if (a){
        a.click()
    }
}