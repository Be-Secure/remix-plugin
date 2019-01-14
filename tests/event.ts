import { Plugin, PluginProfile, Message } from '../src'
import { TxlistenerApi, TxlistenerProfile, TxEmitter, Txlistener } from '../examples/modules'
import { RemixAppManager, PluginManagerComponent } from '../examples/modules'
import { Ethdoc } from '../examples/plugins'

const EthdocProfile: PluginProfile<Ethdoc> = {
  name: 'ethdoc',
  methods: ['getDoc'],
  events: ['createDoc'],
  notifications: {
    'txlistener': ['newTransaction']
  },
  url: 'some-url'
}


describe('Event', () => {
  let app: RemixAppManager
  let component: PluginManagerComponent
  let module: TxlistenerApi
  let plugin: Plugin<Ethdoc>
  let txemitter: TxEmitter
  beforeEach(() => {
    txemitter = new TxEmitter()
    module = new TxlistenerApi(txemitter)
    plugin = new Plugin(EthdocProfile)
    component = new PluginManagerComponent()
    app = new RemixAppManager(component)
    app.init([
      { profile: TxlistenerProfile, api: module },
      { profile: EthdocProfile, api: plugin }
    ])
  })
  test('event from module is broadcasted', () => {
    const spy = spyOn(app, 'broadcast' as any)
    txemitter.createTx('0x')
    expect(spy).toBeCalledWith(module.name, 'newTransaction', {data: '0x'})
  })

  test('event from module is received by plugin', () => {
    const spy = spyOn(plugin, 'postMessage' as any)
    txemitter.createTx('0x')
    expect(spy).toBeCalledWith({name: module.name, key: 'newTransaction', payload: {data: '0x'}})
  })

  test('event from plugin is broadcasted', () => {
    const spy = spyOn(app, 'broadcast' as any)
    if (!EthdocProfile.events) throw new Error('EthdocProfile should have "events"')
    plugin.events.emit(EthdocProfile.events[0], true)
    expect(spy).toBeCalledWith(plugin.name, EthdocProfile.events[0], true)
  })

  test('Plugin receive notification from module', (done) => {
    plugin['source'].addEventListener('message', event => {
      const data = JSON.parse(event.data) as Partial<Message>
      if (data.key === 'handshake') return
      expect(data.payload).toEqual({data: '0x'})
      done()
    }, false)
    txemitter.createTx('0x')
  })
})
