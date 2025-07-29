import Foundation

@objc public class FidoPluginPoc: NSObject {
    @objc public func echo(_ value: String) -> String {
        print(value)
        return value
    }
}
