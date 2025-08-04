# iOS Configuration Reference

When running on macOS, add this to your `ios/Podfile`:

```ruby
platform :ios, '16.0'

# Add this line for Finvu SDK
pod 'FinvuSDK', :git => 'https://github.com/Cookiejar-technologies/finvu_ios_sdk.git', :tag => '1.0.3'

# Rest of your Podfile configuration...
```

After adding the pod, run:
```bash
cd ios && pod install
```

This configuration ensures iOS minimum version 16.0 and includes the Finvu SDK version 1.0.3.