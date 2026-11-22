import UIKit
import AVFoundation
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        window?.backgroundColor = .black
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
    }

    func applicationWillTerminate(_ application: UIApplication) {
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}

class PrayerBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(PrayerAudioRoutePlugin())
    }
}

@objc(PrayerAudioRoutePlugin)
class PrayerAudioRoutePlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "PrayerAudioRoutePlugin"
    let jsName = "PrayerAudioRoute"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "routes", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "select", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "reset", returnType: CAPPluginReturnPromise)
    ]

    private let audio = AVAudioSession.sharedInstance()
    private var changedRoute = false

    override func load() {
        NotificationCenter.default.addObserver(self, selector: #selector(routeChanged(_:)),
            name: AVAudioSession.routeChangeNotification, object: audio)
        NotificationCenter.default.addObserver(self, selector: #selector(interrupted(_:)),
            name: AVAudioSession.interruptionNotification, object: audio)
    }

    @objc private func routeChanged(_ notification: Notification) {
        notifyListeners("routeChanged", data: [:])
    }

    @objc private func interrupted(_ notification: Notification) {
        guard let type = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
              type == AVAudioSession.InterruptionType.began.rawValue else { return }
        notifyListeners("interrupted", data: [:])
    }

    @objc func routes(_ call: CAPPluginCall) {
        let outputs = audio.currentRoute.outputs
        let inputs = (audio.availableInputs ?? []).filter { $0.portType != .builtInMic }
        call.resolve([
            "speaker": outputs.contains { $0.portType == .builtInSpeaker },
            "outputs": outputs.map { $0.portName },
            "inputs": inputs.map { ["id": $0.uid, "name": $0.portName] }
        ])
    }

    @objc func select(_ call: CAPPluginCall) {
        guard let route = call.getString("route") else {
            call.reject("Missing audio route")
            return
        }
        do {
            if audio.category != .playAndRecord {
                try audio.setCategory(.playAndRecord, mode: .voiceChat, options: [.allowBluetooth])
            }
            try audio.setActive(true)
            if route == "speaker" {
                try audio.setPreferredInput(nil)
                try audio.overrideOutputAudioPort(.speaker)
            } else {
                let input = audio.availableInputs?.first { $0.uid == route }
                guard route == "automatic" || input != nil else {
                    call.reject("Audio route unavailable")
                    return
                }
                try audio.overrideOutputAudioPort(.none)
                try audio.setPreferredInput(input)
            }
            changedRoute = true
            call.resolve()
        } catch { call.reject("Unable to switch audio route") }
    }

    @objc func reset(_ call: CAPPluginCall) {
        if changedRoute && audio.category == .playAndRecord {
            try? audio.overrideOutputAudioPort(.none)
            try? audio.setPreferredInput(nil)
        }
        changedRoute = false
        call.resolve()
    }
}
