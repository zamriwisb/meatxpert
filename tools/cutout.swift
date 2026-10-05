// Lift the subject out of a photo with Apple's Vision framework — the same
// model as "Lift subject from background" in Photos — and save it as a
// transparent PNG cropped to the subject.
//
//   swiftc -O tools/cutout.swift -o tools/cutout      (once; needs macOS 14+)
//   tools/cutout <input.jpg> <output.png> [maxWidth]

import Foundation
import Vision
import CoreImage
import CoreImage.CIFilterBuiltins
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
guard args.count >= 3 else {
    FileHandle.standardError.write("usage: cutout <input> <output.png> [maxWidth]\n".data(using: .utf8)!)
    exit(2)
}
let maxWidth = args.count > 3 ? CGFloat(Double(args[3]) ?? 1400) : 1400

guard let input = CIImage(contentsOf: URL(fileURLWithPath: args[1]), options: [.applyOrientationProperty: true]) else {
    FileHandle.standardError.write("cannot read \(args[1])\n".data(using: .utf8)!); exit(1)
}

let request = VNGenerateForegroundInstanceMaskRequest()
let handler = VNImageRequestHandler(ciImage: input)
do { try handler.perform([request]) } catch {
    FileHandle.standardError.write("vision failed: \(error)\n".data(using: .utf8)!); exit(1)
}
guard let result = request.results?.first else {
    FileHandle.standardError.write("no subject found in \(args[1])\n".data(using: .utf8)!); exit(1)
}

// Every detected instance together — a plate and what is on it count as one subject.
let maskBuffer = try result.generateScaledMaskForImage(forInstances: result.allInstances, from: handler)
let mask = CIImage(cvPixelBuffer: maskBuffer)

let blend = CIFilter.blendWithMask()
blend.inputImage = input
blend.backgroundImage = CIImage.empty()
blend.maskImage = mask
guard var out = blend.outputImage else { exit(1) }

// Crop to the subject with a little air round it, then scale down.
let ctx = CIContext()
let alphaBox = mask.extent
var bbox = CGRect.null
if let cg = ctx.createCGImage(mask, from: alphaBox, format: .L8, colorSpace: CGColorSpaceCreateDeviceGray()),
   let data = cg.dataProvider?.data, let ptr = CFDataGetBytePtr(data) {
    let w = cg.width, h = cg.height, row = cg.bytesPerRow
    var minX = w, minY = h, maxX = 0, maxY = 0
    for y in stride(from: 0, to: h, by: 2) {
        for x in stride(from: 0, to: w, by: 2) where ptr[y * row + x] > 24 {
            if x < minX { minX = x }; if x > maxX { maxX = x }
            if y < minY { minY = y }; if y > maxY { maxY = y }
        }
    }
    if maxX > minX && maxY > minY {
        // CGImage rows run top-down; CIImage coordinates run bottom-up.
        bbox = CGRect(x: CGFloat(minX), y: CGFloat(h - maxY), width: CGFloat(maxX - minX), height: CGFloat(maxY - minY))
    }
}
if !bbox.isNull {
    let pad = max(bbox.width, bbox.height) * 0.03
    out = out.cropped(to: bbox.insetBy(dx: -pad, dy: -pad).intersection(input.extent))
}
out = out.transformed(by: CGAffineTransform(translationX: -out.extent.minX, y: -out.extent.minY))
if out.extent.width > maxWidth {
    let s = maxWidth / out.extent.width
    out = out.transformed(by: CGAffineTransform(scaleX: s, y: s))
}

guard let cgOut = ctx.createCGImage(out, from: out.extent, format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!) else { exit(1) }
let url = URL(fileURLWithPath: args[2]) as CFURL
guard let dest = CGImageDestinationCreateWithURL(url, UTType.png.identifier as CFString, 1, nil) else { exit(1) }
CGImageDestinationAddImage(dest, cgOut, nil)
CGImageDestinationFinalize(dest)
print("\(args[2]) \(Int(out.extent.width))x\(Int(out.extent.height))")
