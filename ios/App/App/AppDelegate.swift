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
        CAPPluginMethod(name: "prepare", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "routes", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "select", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "reset", returnType: CAPPluginReturnPromise)
    ]

    private let audio = AVAudioSession.sharedInstance()
    private var selectedRoute = "automatic"

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
        guard let value = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: value) else { return }
        notifyListeners("interrupted", data: ["ended": type == .ended])
    }

    private func activateVoiceAudio() throws {
        if audio.category != .playAndRecord || audio.mode != .voiceChat {
            try audio.setCategory(.playAndRecord, mode: .voiceChat, options: [.allowBluetooth])
        }
        try audio.setActive(true)
    }

    @objc func prepare(_ call: CAPPluginCall) {
        do {
            try activateVoiceAudio()
            call.resolve()
        } catch { call.reject("Unable to activate voice audio") }
    }

    private func selectableInputs() -> [AVAudioSessionPortDescription] {
        (audio.availableInputs ?? []).filter {
            $0.portType == .builtInMic || $0.portType == .bluetoothHFP || $0.portType == .bluetoothLE
        }
    }

    @objc func routes(_ call: CAPPluginCall) {
        let inputs = selectableInputs()
        let outputs = audio.currentRoute.outputs
        var options = [
            ["id": "automatic", "name": "Automatic", "kind": "automatic"]
        ]
        if inputs.contains(where: { $0.portType == .builtInMic }) &&
            outputs.contains(where: { $0.portType == .builtInReceiver || $0.portType == .builtInSpeaker }) {
            options.append(["id": "phone", "name": "iPhone", "kind": "phone"])
        }
        options.append(["id": "speaker", "name": "Speaker", "kind": "speaker"])
        var seen = Set<String>()
        for input in inputs where input.portType != .builtInMic {
            if seen.insert(input.uid).inserted {
                options.append(["id": input.uid, "name": input.portName, "kind": "bluetooth"])
            }
        }

        var selection = "automatic"
        if selectedRoute == "speaker" && outputs.contains(where: { $0.portType == .builtInSpeaker }) {
            selection = "speaker"
        } else if selectedRoute == "phone" && outputs.contains(where: { $0.portType == .builtInReceiver }) {
            selection = "phone"
        } else if selectedRoute != "automatic" && inputs.contains(where: { $0.uid == selectedRoute }) &&
                    audio.currentRoute.inputs.contains(where: { $0.uid == selectedRoute }) {
            selection = selectedRoute
        }
        call.resolve(["selected": selection, "options": options])
    }

    @objc func select(_ call: CAPPluginCall) {
        guard let route = call.getString("route") else {
            call.reject("Missing audio route")
            return
        }
        do {
            try activateVoiceAudio()
            if route == "speaker" {
                try audio.setPreferredInput(nil)
                try audio.overrideOutputAudioPort(.speaker)
            } else {
                let input = selectableInputs().first {
                    route == "phone" ? $0.portType == .builtInMic : $0.uid == route
                }
                guard route == "automatic" || input != nil else {
                    call.reject("Audio route unavailable")
                    return
                }
                try audio.overrideOutputAudioPort(.none)
                try audio.setPreferredInput(input)
            }
            selectedRoute = route
            call.resolve()
        } catch { call.reject("Unable to switch audio route") }
    }

    @objc func reset(_ call: CAPPluginCall) {
        if selectedRoute != "automatic" && audio.category == .playAndRecord {
            try? audio.overrideOutputAudioPort(.none)
            try? audio.setPreferredInput(nil)
        }
        selectedRoute = "automatic"
        call.resolve()
    }
}
