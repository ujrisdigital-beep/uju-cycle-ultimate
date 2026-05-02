#!/bin/bash
# =============================================================================
# Verify Hardware Security Capabilities (TPM 2.0 + Intel SGX)
# =============================================================================

echo "🔍 Verifying Hardware Security Capabilities..."
echo "============================================================================="

# Check TPM 2.0
echo ""
echo "1. TPM 2.0 Check:"
if command -v tpm2_getcap &> /dev/null; then
    echo "   ✅ tpm2-tools installed"
    
    # Check TPM device
    if [ -e "/dev/tpm0" ]; then
        echo "   ✅ TPM device found: /dev/tpm0"
        
        # Get TPM manufacturer info
        TPM_INFO=$(tpm2_getcap -c properties-fixed 2>/dev/null | grep "TPM_PT_MANUFACTURER" || echo "unknown")
        echo "   📋 TPM Info: $TPM_INFO"
        
        # Test quote generation
        if tpm2_quote -c 0x81000001 -l sha256 -q $(openssl rand -hex 32) -m /tmp/test.msg -s /tmp/test.sig 2>/dev/null; then
            echo "   ✅ TPM Quote generation: WORKING"
            rm -f /tmp/test.msg /tmp/test.sig
        else
            echo "   ⚠️ TPM Quote generation: FAILED (may need initialization)"
        fi
    else
        echo "   ❌ TPM device NOT found at /dev/tpm0"
        echo "   → Running in SIMULATION mode"
    fi
else
    echo "   ❌ tpm2-tools NOT installed"
    echo "   → Install: apt-get install tpm2-tools (Linux) or use simulator"
fi

# Check Intel SGX
echo ""
echo "2. Intel SGX Check:"
if [ -e "/dev/isgx" ]; then
    echo "   ✅ SGX device found: /dev/isgx"
    
    # Check if SGX drivers are loaded
    if lsmod | grep -q isgx; then
        echo "   ✅ SGX driver loaded"
    else
        echo "   ⚠️ SGX driver NOT loaded"
    fi
else
    echo "   ❌ SGX device NOT found at /dev/isgx"
    echo "   → Running in SIMULATION mode"
fi

# Check CPU flags for SGX support
if grep -q sgx /proc/cpuinfo 2>/dev/null; then
    echo "   ✅ CPU supports SGX (software)"
else
    echo "   ⚠️ CPU does NOT advertise SGX support"
fi

# Docker capability check
echo ""
echo "3. Docker Security Capabilities:"
if command -v docker &> /dev/null; then
    echo "   ✅ Docker installed"
    
    # Check if we can run with TPM device passthrough
    if docker run --rm --device /dev/tpm0 ubuntu:latest ls /dev/tpm0 2>/dev/null; then
        echo "   ✅ Docker can access TPM device"
    else
        echo "   ⚠️ Docker TPM passthrough NOT available (may need --privileged)"
    fi
else
    echo "   ❌ Docker NOT installed"
fi

# Summary
echo ""
echo "============================================================================="
echo "📊 HARDWARE SECURITY SUMMARY:"
echo "   TPM 2.0 Available: $([ -e "/dev/tpm0" ] && echo 'YES' || echo 'NO (simulation)')"
echo "   Intel SGX Available: $([ -e "/dev/isgx" ] && echo 'YES' || echo 'NO (simulation)')"
echo "   Trust Level: $([ -e "/dev/tpm0" ] && echo 'HIGH' || echo 'LOW (simulated)')"
echo "============================================================================="
echo ""
echo "✅ Hardware verification complete."
echo "   For production: Use hardware with TPM 2.0 + SGX support."
echo "   For development: Simulation mode is acceptable."
