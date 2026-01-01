
// Device information parser for UPower output

function getIconForType(deviceType) {
    switch (deviceType) {
        case "gaming-input":
        case "gamepad":
            return "input-gamepad"
        case "mouse":
            return "input-mouse"
        case "touchpad":
            return "input-touchpad"
        case "keyboard":
            return "input-keyboard"
        case "phone":
        case "smartphone":
            return "smartphone"
        case "tablet":
            return "tablet"
        case "headphones":
        case "headset":
            return "audio-headphones"
        case "monitor":
        case "display":
            return "video-display"
        default:
            return "battery-symbolic"
    }
}

function parseDeviceInfo(output, connectionTypes) {
    var lines = output.split("\n")
    var device = {
        name: "",
        serial: "",
        nativePath: "",
        percentage: -1,
        type: "",
        icon: "battery-symbolic",
        connectionType: connectionTypes.wired,
        objectPath: "",
        bluetoothAddress: ""
    }

    var deviceType = ""

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i]
        var trimmedLine = line.trim()

        if (trimmedLine.indexOf("native-path:") !== -1) {
            device.nativePath = trimmedLine.split(":").slice(1).join(":").trim()
        }
        else if (trimmedLine.indexOf("serial:") !== -1) {
            device.serial = trimmedLine.split(":").slice(1).join(":").trim()
        }
        else if (trimmedLine.indexOf("model:") !== -1) {
            device.name = trimmedLine.split(":").slice(1).join(":").trim()
        }
        else if (trimmedLine.indexOf("percentage:") !== -1) {
            var percentStr = trimmedLine.split(":")[1].trim().replace("%", "")
            device.percentage = parseInt(percentStr)
        }
        // Detect device type: exactly 2 spaces of indentation, single word, no colon
        else if (line.startsWith("  ") && !line.startsWith("    ") &&
            trimmedLine.indexOf(":") === -1 && trimmedLine.indexOf(" ") === -1 &&
            trimmedLine.length > 0) {
            deviceType = trimmedLine
        }
    }

    // Determine connection type from native-path and extract Bluetooth MAC address
    if (device.nativePath) {
        var path = device.nativePath.toLowerCase()
        var macMatch = path.match(/([0-9a-f]{2}[:\-_][0-9a-f]{2}[:\-_][0-9a-f]{2}[:\-_][0-9a-f]{2}[:\-_][0-9a-f]{2}[:\-_][0-9a-f]{2})/i)

        if (path.indexOf("bluez") !== -1 ||
            path.indexOf("bluetooth") !== -1 ||
            macMatch) {
            device.connectionType = connectionTypes.bluetooth
            // Extract and normalize MAC address for bluetoothctl
            if (macMatch) {
                device.bluetoothAddress = macMatch[1].replace(/[_\-]/g, ":").toUpperCase()
            }
        } else {
            device.connectionType = connectionTypes.wireless
        }
    }

    if (deviceType.length > 0) {
        device.type = deviceType
        device.icon = getIconForType(deviceType)
    }

    if (!device.serial && device.nativePath) {
        device.serial = device.nativePath
    }

    return device
}
