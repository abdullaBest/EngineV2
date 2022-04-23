let el = this.el
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
    a.dataset.p   = p
    a.dataset.l   = l
    a.innerText   = name
    a.onclick     = select
    el.appendChild(a)
}

this.add_or_update = (parent_id,id,name,color='white')=>{
    let a = el.querySelector('[data-id="'+id+'"]')
    if (!a){
        this.add(parent_id,id,name,color)
    }else{
        a.innerText = name
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