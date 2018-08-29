const w : number = window.innerWidth, h : number = window.innerHeight
const nodes : number = 5
interface Point {
    x : number
    y : number
}
function getGap() : number {
    return (w / (nodes + 1))
}

function getXY(i : number) : Point {
    return {x: (i + 1) * getGap(), y : h - ((nodes + 1) * getGap()) + (i + 1) *  getGap()}
}

function drawQuaCi(context, sc1 : number, sc2 : number) {
    const gap : number = getGap()
    var j : number = 0
    var degStart : number = -90 + 90 * sc2, degEnd : number = -90 + 90 * sc1
    context.lineWidth = Math.min(w, h) / 60
    context.lineCap = 'round'
    context.beginPath()
    for (var a = degStart; a <= degEnd; a++) {
        const x : number = gap * Math.cos(a * Math.PI/180)
        const y : number = gap * Math.sin(a * Math.PI/180)
        if (j == 0) {
            context.moveTo(x, y)
        } else {
            context.lineTo(x, y)
        }
        j++
    }
    context.stroke()
}

class StepCircPathStage {
    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D
    stepCircPath : StepCircPath = new StepCircPath()
    animator : Animator = new Animator()
    constructor() {
        this.initCanvas()
    }

    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = '#212121'
        this.context.fillRect(0, 0, w, h)
        this.stepCircPath.draw(this.context)
    }

    handleTap() {
        this.canvas.onmousedown = () => {
            this.stepCircPath.startUpdating(() => {
                this.animator.start(() => {
                    this.render()
                    this.stepCircPath.update(() => {
                        this.animator.stop()
                    })
                })
            })
        }
    }
}

class State {
    scale = 0
    dir = 0
    prevScale = 0

    update(cb : Function) {
        this.scale += 0.1 * this.dir
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir
            this.dir = 0
            this.prevScale = this.scale
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
            cb()
        }
    }
}

class Animator {
    animated : boolean = false
    interval : number

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true
            this.interval = setInterval(cb, 50)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false
            clearInterval(this.interval)
        }
    }
}

class SCPNode {
    state : State = new State()
    prev : SCPNode
    next : SCPNode
    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < nodes - 1) {
            this.next = new SCPNode(this.i + 1)
            this.next.prev = this
        }
    }

    draw(context : CanvasRenderingContext2D) {
        context.fillStyle = '#FF8F00'
        context.strokeStyle = '#FF8F00'
        const gap : number = getGap()
        const xy : Point = getXY(this.i)
        const y : number = xy.y
        const x : number = xy.x
        const sc1 : number = Math.min(0.5, this.state.scale) * 2
        const sc2 : number = Math.min(0.5, Math.max(this.state.scale - 0.5, 0)) * 2
        context.save()
        context.translate(x, y)
        drawQuaCi(context, sc1, sc2)
        context.fillRect(-gap, -gap, gap, gap)
        context.restore()
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    getNext(dir : number, cb : Function) : SCPNode {
        var curr : SCPNode = this.prev
        if (dir == 1) {
            curr = this.next
        }
        if (curr) {
            return curr
        }
        cb()
        return this
    }
}

class StepCircPath {
    curr : SCPNode = new SCPNode(0)
    dir : number = 1

    draw(context : CanvasRenderingContext2D) {
        this.curr.draw(context)
    }

    update(cb : Function) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
        })
    }

    startUpdating(cb : Function) {
        this.curr.startUpdating(cb)
    }
}
