#include <CoreGraphics/CoreGraphics.h>
#include <CoreFoundation/CoreFoundation.h>
#include <ImageIO/ImageIO.h>
#include <node_api.h>

static napi_value request_screen_capture_access(napi_env env, napi_callback_info info) {
  bool granted = CGRequestScreenCaptureAccess();
  napi_value result;
  napi_get_boolean(env, granted, &result);
  return result;
}

static napi_value preflight_screen_capture_access(napi_env env, napi_callback_info info) {
  bool granted = CGPreflightScreenCaptureAccess();
  napi_value result;
  napi_get_boolean(env, granted, &result);
  return result;
}

static napi_value capture_below_window(napi_env env, napi_callback_info info) {
  size_t argc = 5;
  napi_value argv[5];
  napi_get_cb_info(env, info, &argc, argv, NULL, NULL);
  if (argc < 5) {
    napi_throw_type_error(env, NULL, "captureBelowWindow expects windowId, x, y, width and height");
    return NULL;
  }

  uint32_t window_id;
  double x;
  double y;
  double width;
  double height;
  napi_get_value_uint32(env, argv[0], &window_id);
  napi_get_value_double(env, argv[1], &x);
  napi_get_value_double(env, argv[2], &y);
  napi_get_value_double(env, argv[3], &width);
  napi_get_value_double(env, argv[4], &height);

  CGRect bounds = CGRectMake(x, y, width, height);
  CGImageRef image = CGWindowListCreateImage(
    bounds,
    kCGWindowListOptionOnScreenBelowWindow,
    (CGWindowID)window_id,
    kCGWindowImageBoundsIgnoreFraming
  );
  if (image == NULL) {
    napi_value null_value;
    napi_get_null(env, &null_value);
    return null_value;
  }

  CFMutableDataRef png_data = CFDataCreateMutable(kCFAllocatorDefault, 0);
  CGImageDestinationRef destination = CGImageDestinationCreateWithData(
    png_data,
    CFSTR("public.png"),
    1,
    NULL
  );
  if (destination == NULL) {
    CGImageRelease(image);
    CFRelease(png_data);
    napi_value null_value;
    napi_get_null(env, &null_value);
    return null_value;
  }

  CGImageDestinationAddImage(destination, image, NULL);
  bool completed = CGImageDestinationFinalize(destination);
  napi_value result;
  if (completed) {
    napi_create_buffer_copy(
      env,
      (size_t)CFDataGetLength(png_data),
      CFDataGetBytePtr(png_data),
      NULL,
      &result
    );
  } else {
    napi_get_null(env, &result);
  }

  CFRelease(destination);
  CFRelease(png_data);
  CGImageRelease(image);
  return result;
}

static napi_value init(napi_env env, napi_value exports) {
  napi_value request;
  napi_value preflight;
  napi_value capture_below;
  napi_create_function(env, "request", NAPI_AUTO_LENGTH, request_screen_capture_access, NULL, &request);
  napi_create_function(env, "preflight", NAPI_AUTO_LENGTH, preflight_screen_capture_access, NULL, &preflight);
  napi_create_function(env, "captureBelowWindow", NAPI_AUTO_LENGTH, capture_below_window, NULL, &capture_below);
  napi_set_named_property(env, exports, "request", request);
  napi_set_named_property(env, exports, "preflight", preflight);
  napi_set_named_property(env, exports, "captureBelowWindow", capture_below);
  return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, init)
