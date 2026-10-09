plugins { id("com.android.application") }

android {
    namespace = "com.lastcorridor.coop"
    compileSdk = 35
    defaultConfig {
        applicationId = "com.lastcorridor.coop"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    buildTypes { getByName("release") { isMinifyEnabled = false } }
}
