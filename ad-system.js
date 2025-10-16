// ad-system.js
class AdSystem {
    constructor() {
        this.spotId = '383135';
        this.adShowFunction = null;
        this.isAdSystemReady = false;
        this.userData = {
            balance: 0,
            adsWatched: 0,
            adsLimit: 250,
            walletAddress: '',
            lastAdWatch: null
        };
    }

    // تهيئة نظام الإعلانات
    async initAdSystem() {
        try {
            console.log('جاري تهيئة نظام الإعلانات...');
            
            if (typeof window.initCdTma === 'undefined') {
                throw new Error('مكتبة الإعلانات غير محملة');
            }

            this.adShowFunction = await window.initCdTma({ 
                id: this.spotId 
            });
            
            this.isAdSystemReady = true;
            console.log('نظام الإعلانات جاهز');
            return true;
            
        } catch (error) {
            console.error('خطأ في تهيئة الإعلانات:', error);
            this.isAdSystemReady = false;
            return false;
        }
    }

    // عرض إعلان
    async showAd() {
        if (this.userData.adsWatched >= this.userData.adsLimit) {
            throw new Error('وصلت للحد الأقصى اليوم من الإعلانات');
        }

        if (!this.isAdSystemReady || !this.adShowFunction) {
            throw new Error('نظام الإعلانات غير جاهز');
        }

        try {
            await this.adShowFunction();
            
            // تحديث بيانات المستخدم بعد مشاهدة الإعلان
            this.userData.balance += 0.00002;
            this.userData.adsWatched++;
            this.userData.lastAdWatch = new Date();
            
            this.saveUserData();
            return true;
            
        } catch (error) {
            console.error('خطأ في تشغيل الإعلان:', error);
            throw new Error('فشل في تشغيل الإعلان');
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
            progressPercent: (this.userData.adsWatched / this.userData.adsLimit) * 100
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
            balance: this.userData.balance
        };
    }
}

// إنشاء نسخة عامة من النظام
window.adSystem = new AdSystem();
