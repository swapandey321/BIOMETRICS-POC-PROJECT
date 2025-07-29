// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "FidoPluginPoc",
    platforms: [.iOS(.v14)],
    products: [
        .library(
            name: "FidoPluginPoc",
            targets: ["FidoPluginPocPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "7.0.0")
    ],
    targets: [
        .target(
            name: "FidoPluginPocPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/FidoPluginPocPlugin"),
        .testTarget(
            name: "FidoPluginPocPluginTests",
            dependencies: ["FidoPluginPocPlugin"],
            path: "ios/Tests/FidoPluginPocPluginTests")
    ]
)