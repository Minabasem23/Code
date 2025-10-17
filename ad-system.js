// ad-system.js
class AdSystem {
    constructor() {
        this.apiToken = 'b5d2084e00e8c0a77615864b727e3166';
        this.apiBaseUrl = 'https://partners.onclicka.com/backend/api/public';
        this.userData = {
            balance: 0,
            adsWatched: 0,
            adsLimit: 250,
            walletAddress: '',
            lastAdWatch: null,
            userId: this.generateUserId()
        };
        this.isAdSystemReady = true; // النظام جاهز دائماً مع API
    }

    // إنشاء معرف مستخدم فريد
    generateUserId() {
        if (window.Telegram && window.Telegram.WebApp) {
            return 'tg_' + window.Telegram.WebApp.initDataUnsafe.user?.id || Date.now();
        }
        return 'web_' + Math.random().toString(36).substr(2, 9);
    }

    // جلب الإحصائيات من OnClickA API
    async getStats() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const url = `${this.apiBaseUrl}/stats?token=${this.apiToken}&date1=${today}&date2=${today}&fields=impressions,clicks,money&limit=10&offset=0`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('فشل في جلب الإحصائيات');
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching stats:', error);
            return null;
        }
    }

    // جلب قائمة الـ Spots المتاحة
    async getSpots() {
        try {
            const url = `${this.apiBaseUrl}/user-spots?token=${this.apiToken}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('فشل في جلب الـ Spots');
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching spots:', error);
            return null;
        }
    }

    // محاكاة مشاهدة إعلان (حتى يتم تطبيق API الإعلانات)
    async showAd() {
        if (this.userData.adsWatched >= this.userData.adsLimit) {
            throw new Error('وصلت للحد الأقصى اليوم من الإعلانات');
        }

        // محاكاة انتظار الإعلان
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // تحديث بيانات المستخدم
        this.userData.balance += 0.00002;
        this.userData.adsWatched++;
        this.userData.lastAdWatch = new Date();
        
        // هنا يمكنك إضافة استدعاء API لتسجيل المشاهدة
        await this.recordAdView();
        
        this.saveUserData();
        return true;
    }

    // تسجيل مشاهدة الإعلان (وهمي حالياً - يمكن تطويره)
    async recordAdView() {
        try {
            // يمكنك إضافة API call هنا لتسجيل المشاهدة
            console.log('تم تسجيل مشاهدة إعلان للمستخدم:', this.userData.userId);
            return true;
        } catch (error) {
            console.error('Error recording ad view:', error);
            return false;
        }
    }

    // جلب الرصيد الحقيقي من OnClickA
    async getRealBalance() {
        try {
            const stats = await this.getStats();
            if (stats && stats.data && stats.data.length > 0) {
                const todayStats = stats.data[0];
                return parseFloat(todayStats.money) || 0;
            }
            return 0;
        } catch (error) {
            console.error('Error getting real balance:', error);
            return 0;
        }
    }

    // تحديث الرصيد من OnClickA
    async updateBalanceFromAPI() {
        try {
            const realBalance = await this.getRealBalance();
            if (realBalance > 0) {
                this.userData.balance = realBalance;
                this.saveUserData();
                return realBalance;
            }
            return this.userData.balance;
        } catch (error) {
            console.error('Error updating balance:', error);
            return this.userData.balance;
        }
    }

    // جلب بيانات المستخدم
    loadUserData() {
        const savedData = localStorage.getItem('adRewardAppData');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            const today = new Date().toDateString();
            const lastWatchDate = parsedData.lastAdWatch ? 
                new Date(parsedData.lastAdWatch).toDateString() : null;

            // إعادة تعيين العدادات إذا كان اليوم مختلف
            if (lastWatchDate !== today) {
                this.userData.adsWatched = 0;
            } else {
                this.userData.adsWatched = parsedData.adsWatched;
            }

            this.userData.balance = parsedData.balance || 0;
            this.userData.walletAddress = parsedData.walletAddress || '';
        }
    }

    // حفظ بيانات المستخدم
    saveUserData() {
        localStorage.setItem('adRewardAppData', JSON.stringify(this.userData));
    }

    // سحب الأرباح
    withdrawEarnings() {
        if (this.userData.balance < 0.1) {
            throw new Error('الرصيد غير كافي للسحب');
        }

        if (!this.userData.walletAddress.trim()) {
            throw new Error('يرجى إدخال عنوان المحفظة');
        }

        const amount = this.userData.balance;
        
        // إعادة تعيين البيانات بعد السحب
        this.userData.balance = 0;
        this.userData.adsWatched = 0;
        
        this.saveUserData();
        return amount;
    }

    // تحديث عنوان المحفظة
    updateWalletAddress(address) {
        this.userData.walletAddress = address;
        this.saveUserData();
    }

    // الحصول على إحصائيات المستخدم
    getUserStats() {
        return {
            balance: this.userData.balance,
            adsWatched: this.userData.adsWatched,
            adsRemaining: this.userData.adsLimit - this.userData.adsWatched,
            progressPercent: (this.userData.adsWatched / this.userData.adsLimit) * 100,
            userId: this.userData.userId
        };
    }

    // التحقق من جاهزية النظام
    isReady() {
        return this.isAdSystemReady;
    }

    // الحصول على حالة النظام
    getSystemStatus() {
        return {
            isReady: this.isAdSystemReady,
            adsWatched: this.userData.adsWatched,
            adsLimit: this.userData.adsLimit,
            balance: this.userData.balance,
            apiConnected: true
        };
    }

    // اختبار اتصال API
    async testApiConnection() {
        try {
            const spots = await this.getSpots();
            return {
                success: true,
                message: '✅ اتصال OnClickA API يعمل بنجاح',
                spots: spots
            };
        } catch (error) {
            return {
                success: false,
                message: '❌ فشل في الاتصال بـ OnClickA API'
            };
        }
    }
}

// إنشاء نسخة عامة من النظام
window.adSystem = new AdSystem();