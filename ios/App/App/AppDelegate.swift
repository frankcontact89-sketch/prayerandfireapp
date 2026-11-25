import UIKit
import AVFoundation
import CallKit
import ContactsUI
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
class PrayerAudioRoutePlugin: CAPPlugin, CAPBridgedPlugin, CXProviderDelegate, CNContactViewControllerDelegate {
    let identifier = "PrayerAudioRoutePlugin"
    let jsName = "PrayerAudioRoute"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "prepare", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "routes", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "select", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "reset", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startSystemCall", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "endSystemCall", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestSystemMute", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "completeSystemMute", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "presentContact", returnType: CAPPluginReturnPromise)
    ]

    private let audio = AVAudioSession.sharedInstance()
    private var selectedRoute = "automatic"

    private let callController = CXCallController()
    private var systemCallID: UUID?
    private var pendingMute: CXSetMutedCallAction?
    private lazy var callProvider: CXProvider = {
        let configuration = CXProviderConfiguration()
        configuration.maximumCallGroups = 1
        configuration.maximumCallsPerCallGroup = 1
        configuration.supportsVideo = false
        configuration.includesCallsInRecents = false
        configuration.supportedHandleTypes = [.generic]
        let provider = CXProvider(configuration: configuration)
        provider.setDelegate(self, queue: .main)
        return provider
    }()

    @objc func startSystemCall(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.systemCallID == nil else { call.reject("System call already exists"); return }
            let id = UUID()
            self.systemCallID = id
            _ = self.callProvider
            let handle = CXHandle(type: .generic, value: call.getString("name") ?? "Prayer & Fire")
            self.callController.request(CXTransaction(action: CXStartCallAction(call: id, handle: handle))) { error in
                DispatchQueue.main.async {
                    guard self.systemCallID == id else { call.reject("Room ended"); return }
                    if error != nil {
                        self.systemCallID = nil
                        call.reject("System call unavailable")
                    } else {
                        call.resolve(["id": id.uuidString])
                    }
                }
            }
        }
    }

    @objc func endSystemCall(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if let id = self.systemCallID, call.getString("id") == id.uuidString {
                self.finishSystemCall()
                self.callProvider.reportCall(with: id, endedAt: Date(), reason: .remoteEnded)
            }
            call.resolve()
        }
    }

    @objc func requestSystemMute(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let id = self.systemCallID, call.getString("id") == id.uuidString,
                  let muted = call.getBool("muted") else { call.reject("No matching call"); return }
            self.callController.request(CXTransaction(action: CXSetMutedCallAction(call: id, muted: muted))) { error in
                if error != nil { call.reject("Unable to request mute") }
                else { call.resolve() }
            }
        }
    }

    @objc func completeSystemMute(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if let action = self.pendingMute, call.getString("actionID") == action.uuid.uuidString {
                self.pendingMute = nil
                if call.getBool("applied") == true { action.fulfill() }
                else { action.fail() }
            }
            call.resolve()
        }
    }

    private func finishSystemCall() {
        pendingMute?.fail()
        pendingMute = nil
        systemCallID = nil
    }

    func providerDidReset(_ provider: CXProvider) {
        guard let id = systemCallID else { return }
        finishSystemCall()
        notifyListeners("systemCallEnded", data: ["id": id.uuidString])
    }

    func provider(_ provider: CXProvider, perform action: CXStartCallAction) {
        guard action.callUUID == systemCallID else { action.fail(); return }
        action.fulfill()
        provider.reportOutgoingCall(with: action.callUUID, connectedAt: Date())
    }

    func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        guard action.callUUID == systemCallID else { action.fail(); return }
        finishSystemCall()
        notifyListeners("systemCallEnded", data: ["id": action.callUUID.uuidString])
        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXSetMutedCallAction) {
        guard action.callUUID == systemCallID, pendingMute == nil else { action.fail(); return }
        pendingMute = action
        notifyListeners("systemMute", data: [
            "id": action.callUUID.uuidString, "actionID": action.uuid.uuidString, "muted": action.isMuted
        ])
    }

    func provider(_ provider: CXProvider, timedOutPerforming action: CXAction) {
        if pendingMute?.uuid == action.uuid { pendingMute = nil }
    }

    @objc func presentContact(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let controller = self.bridge?.viewController,
                  controller.presentedViewController == nil,
                  let name = call.getString("name"), !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                call.reject("Unable to open contact editor")
                return
            }
            let contact = CNMutableContact()
            contact.givenName = String(name.prefix(150))
            let editor = CNContactViewController(forNewContact: contact)
            editor.delegate = self
            controller.present(UINavigationController(rootViewController: editor), animated: true) {
                call.resolve()
            }
        }
    }

    func contactViewController(_ viewController: CNContactViewController, didCompleteWith contact: CNContact?) {
        viewController.dismiss(animated: true)
    }

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
            $0.portType == .builtInMic || $0.portType == .bluetoothHFP || $0.portType == .bluetoothLE ||
                $0.portType == .headsetMic
        }
    }

    @objc func routes(_ call: CAPPluginCall) {
        let inputs = selectableInputs()
        let outputs = audio.currentRoute.outputs
        var options = [
            ["id": "automatic", "name": "Automatic", "kind": "automatic"]
        ]
        if UIDevice.current.userInterfaceIdiom == .phone &&
            inputs.contains(where: { $0.portType == .builtInMic }) {
            options.append(["id": "phone", "name": "iPhone", "kind": "phone"])
        }
        options.append(["id": "speaker", "name": "Speaker", "kind": "speaker"])
        var seen = Set<String>()
        for input in inputs where input.portType != .builtInMic {
            if seen.insert(input.uid).inserted {
                let kind = input.portType == .headsetMic ? "headphones" : "bluetooth"
                options.append(["id": input.uid, "name": input.portName, "kind": kind])
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
                guard route == "automatic" ||
                      (input != nil && (route != "phone" || UIDevice.current.userInterfaceIdiom == .phone)) else {
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
